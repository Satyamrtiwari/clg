import json
import logging
from typing import Dict, List, Any
from fastapi import WebSocket

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # active_connections maps channel ("display", "cashier", "all") to list of WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {
            "display": [],
            "cashier": [],
            "all": []
        }

    async def connect(self, websocket: WebSocket, channel: str = "display"):
        await websocket.accept()
        if channel not in self.active_connections:
            self.active_connections[channel] = []
        self.active_connections[channel].append(websocket)
        self.active_connections["all"].append(websocket)
        logger.info(f"WebSocket client connected to channel: {channel}. Total clients: {len(self.active_connections['all'])}")

    def disconnect(self, websocket: WebSocket, channel: str = "display"):
        if channel in self.active_connections and websocket in self.active_connections[channel]:
            self.active_connections[channel].remove(websocket)
        if websocket in self.active_connections["all"]:
            self.active_connections["all"].remove(websocket)
        logger.info(f"WebSocket client disconnected from channel: {channel}.")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)

    async def broadcast(self, message: dict, channel: str = "all"):
        target_connections = self.active_connections.get(channel, [])
        if channel != "all":
            # Also include clients in 'all' if any
            target_connections = list(set(target_connections + self.active_connections.get("all", [])))

        disconnected = []
        for connection in target_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.warning(f"Error sending message to WebSocket client: {e}")
                disconnected.append((connection, channel))

        # Cleanup failed connections
        for conn, ch in disconnected:
            self.disconnect(conn, ch)

ws_manager = ConnectionManager()
