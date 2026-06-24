import httpx
from config import SUPABASE_URL, SUPABASE_SERVICE_KEY

# Base REST URL for PostgREST
REST_URL = f"{SUPABASE_URL}/rest/v1"

# Common headers for all Supabase REST API calls
HEADERS = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}

# Global httpx client for connection pooling
_client = httpx.Client(headers=HEADERS, timeout=30.0)


class SupabaseTable:
    """Lightweight wrapper that mimics supabase-py table query interface using direct REST calls."""

    def __init__(self, table_name: str):
        self.table_name = table_name
        self.url = f"{REST_URL}/{table_name}"
        self._params: dict = {}
        self._headers: dict = {}
        self._method = "GET"
        self._body = None

    def select(self, columns: str = "*", count: str = None):
        self._method = "GET"
        self._params["select"] = columns
        if count == "exact":
            self._headers["Prefer"] = "count=exact"
        return self

    def insert(self, data: dict):
        self._method = "POST"
        self._body = data
        return self

    def update(self, data: dict):
        self._method = "PATCH"
        self._body = data
        return self

    def eq(self, column: str, value):
        self._params[column] = f"eq.{value}"
        return self

    def order(self, column: str, desc: bool = False):
        direction = "desc" if desc else "asc"
        self._params["order"] = f"{column}.{direction}"
        return self

    def execute(self):
        headers = {**HEADERS, **self._headers}

        if self._method == "GET":
            r = _client.get(self.url, params=self._params, headers=headers)
        elif self._method == "POST":
            r = _client.post(self.url, json=self._body, params=self._params, headers=headers)
        elif self._method == "PATCH":
            r = _client.patch(self.url, json=self._body, params=self._params, headers=headers)
        elif self._method == "DELETE":
            r = _client.delete(self.url, params=self._params, headers=headers)
        else:
            raise ValueError(f"Unsupported method: {self._method}")

        r.raise_for_status()

        data = r.json() if r.content else []

        # Parse count from Content-Range header if present
        count = None
        content_range = r.headers.get("Content-Range")
        if content_range:
            # Format: "0-4/5" or "*/5"
            parts = content_range.split("/")
            if len(parts) == 2 and parts[1] != "*":
                count = int(parts[1])

        return _QueryResult(data=data, count=count)


class _QueryResult:
    """Mimics the supabase-py response object."""

    def __init__(self, data, count=None):
        self.data = data
        self.count = count


class SupabaseClient:
    """Lightweight Supabase client using direct REST API calls."""

    def table(self, table_name: str) -> SupabaseTable:
        return SupabaseTable(table_name)


# Global client instance
_supabase_client = SupabaseClient()


def get_supabase() -> SupabaseClient:
    """Return the global Supabase client instance."""
    return _supabase_client
