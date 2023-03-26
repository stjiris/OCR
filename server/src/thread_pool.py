from threading import Thread

class ThreadPool:
    def __init__(self, target_function, max_threads):
        self.target_function = target_function
        self.max_threads = max_threads
        self.current_threads = 0

        self.waiting_list = []
        self.processing_list = []

    def add_to_queue(self, args):
        self.waiting_list.append(args)
        self.update()

    def update(self, finished=None):
        if finished is not None:
            self.current_threads -= 1
            self.processing_list.remove(finished)

        if self.current_threads < self.max_threads and len(self.waiting_list) > 0:
            self.current_threads += 1
            self.execute()
            
    def execute(self):
        # Get the list of all the files pending
        files = set([x[0] for x in self.waiting_list])

        item = None
        for file in files:
            # Already processing this file, skip it
            if file in self.processing_list: continue

            # Get the first item that is not being processed
            for id, f in enumerate(self.waiting_list):
                if f[0] == file:
                    item = self.waiting_list.pop(id)
                    break

        # If can't find new file, just pop the first one
        if item is None:
            item = self.waiting_list.pop(0)

        self.processing_list.append(item[0])

        # Start thread
        thread = Thread(target=self.target_function, args=(*item, self, ))
        thread.start()