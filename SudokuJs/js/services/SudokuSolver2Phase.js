﻿sudokuJs.factory('sudokuSolver2Phase', function (httpLogger, $timeout) {
    var PuzzleEnumerator = function (puzzle) {

        this.puzzle = puzzle;
        var rowIndex = 0;
        var columnIndex = -1;

        this.moveNextCell = function () {
            if (columnIndex < this.puzzle.rows[0].cells.length - 1) {
                columnIndex++;
            }
            else {
                if (rowIndex < this.puzzle.rows.length - 1) {
                    rowIndex++;
                    columnIndex = 0;
                }
                else {
                    return false;
                }
            }

            return true;
        };

        this.movePreviousCell = function () {
            if (columnIndex > 0) {
                columnIndex--;
            }
            else {
                if (rowIndex > 0) {
                    rowIndex--;
                    columnIndex = this.puzzle.rows[0].cells.length - 1;
                }
                else {
                    return false;
                }
            }

            return true;
        };

        this.moveNext = function () {
            while (this.moveNextCell()) {
                if (this.current().value === '')
                    return this.current();
            }
            return false;
        };

        this.movePrevious = function () {
            while (this.movePreviousCell()) {
                var cell = this.current();
                if (this.current().given != 'given')
                    return this.current();
            }
            return false;
        };


        this.current = function () {
            return this.puzzle.rows[rowIndex].cells[columnIndex];
        }
    }

    var calculatePossibilities = function (puzzle, row, column) {
        var possibilities = new Collection([1, 2, 3, 4, 5, 6, 7, 8, 9]);

        var valuesInRow = getValuesInRow(puzzle, row);
        valuesInRow.forEach(function (value) {
            possibilities.remove(value);
        });

        var valuesInColumn = getValuesInColumn(puzzle, column);
        valuesInColumn.forEach(function (value) {
            possibilities.remove(value);
        });

        var valuesInBlock = getValuesInBlock(puzzle, row, column);
        valuesInBlock.forEach(function (value) {
            possibilities.remove(value);
        });

        return possibilities;
    }

    var getValuesInRow = function (puzzle, row) {
        var myCollection = new Collection();
        puzzle.rows[row].cells.forEach(function (cell) {
            if (cell.value != '') {
                myCollection.add(cell.value);
            }
        });

        return myCollection;
    }

    var getValuesInColumn = function (puzzle, column) {
        var myCollection = new Collection();
        //lus door alle rijen
        puzzle.rows.forEach(function (row) {
            var cell = row.cells[column];
            if (cell.value != '') {
                myCollection.add(cell.value);
            }
        });

        return myCollection;
    }

    var getValuesInBlock = function (puzzle, row, column) {
        var intRow = parseInt(row / 3)
        var minRow = 3 * intRow;
        var maxRow = 3 * (intRow + 1) - 1;

        var intColumn = parseInt(column / 3)
        var minColumn = 3 * intColumn;
        var maxColumn = 3 * (intColumn + 1) - 1;

        var myCollection = new Collection();
        //lus door alle rijen
        for (var rowIndex = minRow; rowIndex <= maxRow; rowIndex++) {
            for (var columnIndex = minColumn; columnIndex <= maxColumn; columnIndex++) {
                var cell = puzzle.rows[rowIndex].cells[columnIndex];
                if (cell.value != '') {
                    myCollection.add(cell.value);
                }
            }
        }

        return myCollection;
    }

    var solve = function (puzzle, rowIndex, columnIndex) {
        var value = puzzle.rows[rowIndex].cells[columnIndex];
        if (value.value === '') {
            var possibilities = calculatePossibilities(puzzle, rowIndex, columnIndex);
            var tryValue = possibilities.get(0);
            if (tryValue) {
                value.value = possibilities.get(0);
            }
            else {
                return false;
            }
        }

        return true;
    }

    var teller = 0;
    var log = function (text) {
        var paddedText = teller + '|\'' + text + '\'';
        httpLogger.savePuzzle({ name: paddedText });
        //        console.log(paddedText);
        teller++;
    }

    var solveRecursively = function (puzzle, nesting, enumerator, oldValue) {

        var cell;
        if (!oldValue) {
            if (enumerator.moveNext()) {
                cell = enumerator.current();
            }
            else {
                return;
            }
        }

        var cell = enumerator.current();
        var possibilities = calculatePossibilities(puzzle, cell.rowIndex, cell.columnIndex);

        log(nesting + ' - (' + cell.rowIndex + ',' + cell.columnIndex + ') heeft mogelijkheden ' + possibilities.toString());

        var possibility = possibilities.getEnumerator();
        if (possibility.moveNext()) {
            var value = possibility.current();
            var message = nesting + ' - (' + cell.rowIndex + ',' + cell.columnIndex + ') probeer ' + value;
            log(message);
            cell.value = value;

            //een niveau dieper gaan
            $timeout(function () {
                solveRecursively(puzzle, nesting + 1, enumerator, null);
            }, 0);

            log(nesting + ' - Terugkomst uit solveRecursively');
        }
        else {
            log(nesting + ' - Geen mogelijkheden voor cel (' + cell.rowIndex + ',' + cell.columnIndex + ')');

            var previousCell = enumerator.movePrevious();
            var oldValue = previousCell.value;
            previousCell.value = '';
            $timeout(function () {
                solveRecursively(puzzle, nesting + 1, enumerator, oldValue);
            }, 0);
        }
        return;
    }

    function sleep(seconds) {
        var e = new Date().getTime() + (seconds * 1000);
        while (new Date().getTime() <= e) { }
    }

    var enkeleWaardenInvullen = function (puzzle) {
        var enumerator = new PuzzleEnumerator(puzzle);

        var success = false;
        while (enumerator.moveNext()) {
            var cell = enumerator.current();
            var possibilities = calculatePossibilities(puzzle, cell.rowIndex, cell.columnIndex);
            if (possibilities.count === 1) {
                cell.value = possibilities.get(0);
                success = true;
            }
        }

        if (success) {
            $timeout(function () {
                enkeleWaardenInvullen(puzzle);
            }, 1000);
        }
    }

    return {
        solvePuzzle: function (puzzle) {
            //for (var rowIndex = 0; rowIndex < puzzle.rows.length; rowIndex++) {
            //    for (var columnIndex = 0; columnIndex < puzzle.rows[rowIndex].cells.length; columnIndex++) {
            //        var cell = puzzle.rows[rowIndex].cells[columnIndex];
            //        cell.rowIndex = rowIndex;
            //        cell.columnIndex = columnIndex;
            //    }
            //}


            enkeleWaardenInvullen(puzzle);

            //var enumerator = new PuzzleEnumerator(puzzle);
            //solveRecursively(puzzle, 0, enumerator, null);

            //var enumerator = new PuzzleEnumerator(puzzle);
            //while (enumerator.moveNext()) {
            //    var cell = enumerator.current();
            //    cell.value = 9;
            //    console.log('(' + cell.rowIndex + ', ' + cell.columnIndex + ')');
            //    $rootScope.$apply;
            //    sleep(1);
            //}



        },

        showPossibilities: function () {
            calculatePossibilities();
        }
    };
});