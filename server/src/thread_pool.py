import time
from threading import Thread

class ThreadPool:
    def __init__(self, target_function, waiting_list, max_threads, delay = 5):
        self.target_function = target_function
        self.waiting_list = waiting_list
        self.max_threads = max_threads
        self.delay = delay
        self.threads = []

        self.start_thread()

    def start_thread(self):
        thread = Thread(target=self.execute, daemon=True)
        thread.start()

    def execute(self):
        active_threads = []
        while True:
            time.sleep(self.delay)

            # Remove finished threads
            for t in active_threads:
                if not t.is_alive():
                    active_threads.remove(t)

            while len(self.waiting_list) > 0 and len(active_threads) <= self.max_threads:
                # Get next item from waiting list
                item = self.waiting_list.pop(0)

                # Start thread
                thread = Thread(target=self.target_function, args=(*item,))
                thread.start()
                active_threads.append(thread)