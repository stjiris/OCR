# import subprocess
import os
import psutil

from src.utils.file import PRIVATE_PATH
from src.utils.file import get_data


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
        session.name for session in os.scandir(PRIVATE_PATH)
        if session.is_dir()
    ]
    return private_sessions


def get_size_private_sessions():
    # Get the private sessions
    private_sessions = {}
    for session in os.scandir(PRIVATE_PATH):
        if session.is_dir():
            size = 0
            for dirpath, dirnames, filenames in os.walk(session.path):
                for f in filenames:
                    path = os.path.join(dirpath, f)
                    if not os.path.islink(path):
                        size += os.path.getsize(path)
            private_sessions[session.name] = {"size": format_size(size), "creation": get_data(f"{session.path}/_data.json")["creation"]}
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

    return format_size(free_space), f"{free_space_percentage:.2f}"


def format_size(size: int) -> str:
    """
    Convert the given size in bytes to a string of the value in the most appropriate unit
    :param size: size in bytes
    :return: string formatted as "{value rounded to 2 cases} {unit}"
    """
    if size < 1024:
        size = f'{size} B'
    elif size < 1024 ** 2:
        size = f'{size / 1024:.2f} KB'
    elif size < 1024 ** 3:
        size = f'{size / 1024 ** 2:.2f} MB'
    elif size < 1024 ** 4:
        size = f'{size / 1024 ** 3:.2f} GB'
    else:
        size = f'{size / 1024 ** 4:.2f} TB'
    return size
