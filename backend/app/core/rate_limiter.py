import time
from collections import defaultdict, deque
from threading import Lock
from typing import Tuple


class SlidingWindowRateLimiter:
    """
    Thread-safe in-memory sliding window rate limiter.
    Easily pluggable or swappable with Redis in distributed deployments.
    """

    def __init__(self, window_seconds: int = 60):
        self.window_seconds = window_seconds
        self.history: dict[str, deque] = defaultdict(deque)
        self.lock = Lock()

    def is_allowed(self, identifier: str, limit_per_window: int) -> Tuple[bool, int, int]:
        """
        Check if request is allowed.
        Returns: (allowed: bool, current_count: int, limit: int)
        """
        now = time.time()
        cutoff = now - self.window_seconds

        with self.lock:
            timestamps = self.history[identifier]

            # Pop older timestamps outside the window
            while timestamps and timestamps[0] < cutoff:
                timestamps.popleft()

            current_count = len(timestamps)

            if current_count >= limit_per_window:
                return False, current_count, limit_per_window

            # Record this request
            timestamps.append(now)
            return True, current_count + 1, limit_per_window

    def reset(self, identifier: str):
        with self.lock:
            if identifier in self.history:
                del self.history[identifier]


# Global rate limiter instance for API gateway
api_rate_limiter = SlidingWindowRateLimiter(window_seconds=60)
