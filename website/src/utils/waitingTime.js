function calculateEstimatedTime(pagesProcessed, totalPages) {
    /*
        Using the pages as a reference, we can calculate the estimated time

        Data used:
        - 50 pages - 1min
        - 100 pages - 2min
        - 200 pages - 4min
        - 500 pages - 9min
        - 1100 pages - 10.5min
        - 4000 pages - 21min
    */

    let pagesLeft = totalPages - pagesProcessed;
    if (pagesLeft < 20) {
        return "<1";
    }
    return Math.ceil(0.0176 * pagesLeft + 0.2632);
}

export default calculateEstimatedTime;
