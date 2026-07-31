from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
import logging
from app.core.ws_manager import ws_manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ws", tags=["WebSockets"])

@router.websocket("/{channel}")
async def websocket_endpoint(websocket: WebSocket, channel: str = "display"):
    await ws_manager.connect(websocket, channel=channel)
    try:
        while True:
            # Keep connection open & handle incoming ping/pong or client messages
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, channel=channel)
    except Exception as e:
        logger.error(f"WebSocket error in channel '{channel}': {e}")
        ws_manager.disconnect(websocket, channel=channel)
