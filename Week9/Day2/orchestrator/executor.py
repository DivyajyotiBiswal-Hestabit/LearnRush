from agents.worker_agent import WorkerAgent
import threading


class Executor:
    def __init__(self):
        self.worker = WorkerAgent()
        self.results = {}

    def run_task(self, task):
        result = self.worker.execute(task["task"])
        self.results[task["id"]] = result

    def execute(self, plan):
        completed = set()

        while len(completed) < len(plan):
            threads = []

            for task in plan:
                if task["id"] in completed:
                    continue

                # Check dependencies
                if all(dep in completed for dep in task["depends_on"]):
                    t = threading.Thread(target=self.run_task, args=(task,))
                    threads.append(t)
                    t.start()
                    completed.add(task["id"])

            for t in threads:
                t.join()

        return self.results