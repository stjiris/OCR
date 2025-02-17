import subprocess
import os
import psutil

from src.utils.file import PRIVATE_PATH


def get_logs(
    starting_point: int = 0,
    number_of_logs: int = 50,
    endpoints: list = None
):
    # try:
    #     # Using subprocess to get the logs
    #     res = subprocess.run(
    #         "docker logs ocr-server-1 -f",
    #         shell=True,
    #         check=True,
    #         capture_output=True,
    #         text=True,
    #         stderr=subprocess.DEVNULL,
    #     )

    #     for l in res.stdout.split('\n'):
    #         with open('record.log', 'a') as file:
    #             file.write(l + '\n')

    # except Exception as e:
    #     pass

    # Get the logs of the app
    with open('record.log', 'r') as file:
        logs = file.readlines()

    # Get the logs of the endpoints
    if endpoints:
        logs = [
            l for l in logs
            if any(
                endpoint in l for endpoint in endpoints
            )
        ]

    # Get the logs from the starting point
    logs = logs[::-1][starting_point:starting_point + number_of_logs]

    return logs

def get_private_sessions():
    # Get the private sessions
    private_sessions = [
        session for session in os.listdir(PRIVATE_PATH)
        if os.path.isdir(f"{PRIVATE_PATH}/{session}") and session not in ['.pytest_cache', '__pycache__', 'src', 'files', 'pending-files']
    ]
    return private_sessions

def get_free_space():
    # Get the free space of the disk and its percentage
    # UNIX usually reserves ~5% of total for root user;
    # 'total' and 'used' are overall total and used space
    # 'free' is space available for current user, 'percent' is user utilization
    disk_usage = psutil.disk_usage('/')
    free_space = disk_usage.free
    total_space = disk_usage.used + disk_usage.free

    free_space_percentage = free_space / total_space * 100

    # Convert the free space to the closest size format (B, KB, MB, GB, TB)
    if free_space < 1024:
        free_space = f'{free_space} B'
    elif free_space < 1024 ** 2:
        free_space = f'{free_space / 1024:.2f} KB'
    elif free_space < 1024 ** 3:
        free_space = f'{free_space / 1024 ** 2:.2f} MB'
    elif free_space < 1024 ** 4:
        free_space = f'{free_space / 1024 ** 3:.2f} GB'
    else:
        free_space = f'{free_space / 1024 ** 4:.2f} TB'

    return free_space, f"{free_space_percentage:.2f}"
