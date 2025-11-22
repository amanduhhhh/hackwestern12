import requests
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime

logger = logging.getLogger(__name__)


class ClashRoyaleDataFetcher:
    def __init__(self, api_key: str = ""):
        self.api_key = api_key
        self.base_url = "https://api.clashroyale.com/v1"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Accept": "application/json",
        }

    def _encode_tag(self, tag: str) -> str:
        if tag.startswith("#"):
            return "%23" + tag[1:]
        return "%23" + tag

    def get_player(self, player_tag: str) -> Optional[Dict[str, Any]]:
        try:
            encoded_tag = self._encode_tag(player_tag)
            r = requests.get(
                f"{self.base_url}/players/{encoded_tag}",
                headers=self.headers,
                timeout=10,
            )
            r.raise_for_status()
            data = r.json()

            return {
                "tag": data.get("tag"),
                "name": data.get("name"),
                "trophies": data.get("trophies"),
                "best_trophies": data.get("bestTrophies"),
                "wins": data.get("wins"),
                "losses": data.get("losses"),
                "battle_count": data.get("battleCount"),
                "three_crown_wins": data.get("threeCrownWins"),
                "challenge_max_wins": data.get("challengeMaxWins"),
                "arena": data.get("arena", {}).get("name"),
                "clan": data.get("clan", {}).get("name") if data.get("clan") else None,
                "role": data.get("role"),
                "exp_level": data.get("expLevel"),
                "cards_count": len(data.get("cards", [])),
            }
        except Exception as e:
            logger.error(f"Failed to fetch Clash Royale player {player_tag}: {e}")
            return None

    def get_player_battle_log(
        self, player_tag: str, limit: int = 10
    ) -> Optional[List[Dict[str, Any]]]:
        try:
            encoded_tag = self._encode_tag(player_tag)
            r = requests.get(
                f"{self.base_url}/players/{encoded_tag}/battlelog",
                headers=self.headers,
                timeout=10,
            )
            r.raise_for_status()

            battles = []
            for battle in r.json()[:limit]:
                team = battle.get("team", [{}])[0]
                opponent = battle.get("opponent", [{}])[0]
                team_crowns = team.get("crowns", 0)
                opponent_crowns = opponent.get("crowns", 0)

                battles.append(
                    {
                        "type": battle.get("type"),
                        "battle_time": battle.get("battleTime"),
                        "arena": battle.get("arena", {}).get("name"),
                        "team_crowns": team_crowns,
                        "opponent_crowns": opponent_crowns,
                        "opponent_name": opponent.get("name"),
                        "result": "win"
                        if team_crowns > opponent_crowns
                        else "loss"
                        if team_crowns < opponent_crowns
                        else "draw",
                    }
                )

            return battles
        except Exception as e:
            logger.error(f"Failed to fetch Clash Royale battle log: {e}")
            return None

    def get_player_upcoming_chests(
        self, player_tag: str
    ) -> Optional[List[Dict[str, Any]]]:
        try:
            encoded_tag = self._encode_tag(player_tag)
            r = requests.get(
                f"{self.base_url}/players/{encoded_tag}/upcomingchests",
                headers=self.headers,
                timeout=10,
            )
            r.raise_for_status()
            return r.json().get("items", [])
        except Exception as e:
            logger.error(f"Failed to fetch Clash Royale chests: {e}")
            return None

    def get_current_deck(self, player_tag: str) -> Optional[List[Dict[str, Any]]]:
        try:
            encoded_tag = self._encode_tag(player_tag)
            r = requests.get(
                f"{self.base_url}/players/{encoded_tag}",
                headers=self.headers,
                timeout=10,
            )
            r.raise_for_status()
            data = r.json()

            deck = []
            for card in data.get("currentDeck", []):
                deck.append(
                    {
                        "name": card.get("name"),
                        "level": card.get("level"),
                        "max_level": card.get("maxLevel"),
                        "elixir": card.get("elixirCost"),
                        "rarity": card.get("rarity"),
                    }
                )

            return deck
        except Exception as e:
            logger.error(f"Failed to fetch Clash Royale deck: {e}")
            return None

    def fetch_user_summary(self, player_tag: str) -> Optional[Dict[str, Any]]:
        player = self.get_player(player_tag)
        if not player:
            return None

        battles = self.get_player_battle_log(player_tag, limit=5)
        deck = self.get_current_deck(player_tag)
        chests = self.get_player_upcoming_chests(player_tag)

        return {
            "player": player,
            "recent_battles": battles or [],
            "current_deck": deck or [],
            "upcoming_chests": chests[:5] if chests else [],
            "last_updated": datetime.now().isoformat(),
        }

    def is_authenticated(self) -> bool:
        return bool(self.api_key)
