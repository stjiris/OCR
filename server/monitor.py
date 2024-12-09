import psutil
import time

def monitor_celery_worker():
    """Monitor memory usage of the Celery worker process (PID 1)."""
    pid = 1  # Celery worker process ID in Docker container
    try:
        process = psutil.Process(pid)
        print(f"Monitoring memory for process: {process.name()} (PID: {process.pid})")
        print("-" * 40)

        while True:
            memory_usage = process.memory_info().rss / (1024 * 1024)
            print(f"Memory Usage for PID {pid}: {memory_usage:.2f} MB")
            time.sleep(5)
    except psutil.NoSuchProcess:
        print(f"Process with PID {pid} not found.")
    except KeyboardInterrupt:
        print("Monitoring stopped.")

if __name__ == "__main__":
    monitor_celery_worker()
