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

        The regression formula is:
        Y = 0.004650*X + 3.305
    */

    var pagesLeft = totalPages - pagesProcessed;
    return Math.ceil(0.004650 * pagesLeft + 3.305);
}

export default calculateEstimatedTime;