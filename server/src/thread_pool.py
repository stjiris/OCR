from threading import Thread

class ThreadPool:
    def __init__(self, target_function, max_threads):
        self.target_function = target_function
        self.max_threads = max_threads
        self.current_threads = 0

        self.waiting_list = []

    def add_to_queue(self, args):
        self.waiting_list.append(args)
        self.update()

    def update(self, finished=False):
        if finished: self.current_threads -= 1

        if self.current_threads < self.max_threads and len(self.waiting_list) > 0:
            self.current_threads += 1
            self.execute()
            
    def execute(self):
        item = self.waiting_list.pop(0)

        # Start thread
        thread = Thread(target=self.target_function, args=(*item, self, ))
        thread.start()