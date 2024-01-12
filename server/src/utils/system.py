import os
import psutil

from flask import Flask

def get_logs(
    starting_point: int = 0,
    number_of_logs: int = 50,
    endpoints: list = None
):
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
        session for session in os.listdir("files/_private_sessions")
        if os.path.isdir(f"files/_private_sessions/{session}") and session not in ['.pytest_cache', '__pycache__', 'src', 'files', 'pending-files']
    ]
    return private_sessions

def get_free_space():
    # Get the free space of the disk and its percentage
    disk_usage = psutil.disk_usage('/')
    free_space = disk_usage.free
    total_space = disk_usage.total

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