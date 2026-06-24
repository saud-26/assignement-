import logging
from fastapi import APIRouter

from services.ranking_engine import compute_rankings

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/ranking")
async def get_ranking():
    """
    Get the leaderboard with weighted ranking scores for all users.
    """
    try:
        result = compute_rankings()
        return result
    except Exception as e:
        logger.error(f"Error computing rankings: {e}", exc_info=True)
        raise
