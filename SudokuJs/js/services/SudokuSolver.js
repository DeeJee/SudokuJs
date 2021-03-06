﻿sudokuJs.factory('sudokuSolver', function (httpLogger) {
    var PuzzleEnumerator = function (puzzle) {

        this.puzzle = puzzle;
        var rowIndex = 0;
        var columnIndex = -1;

        this.moveNext = function () {
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

        this.current = function () {
            return this.puzzle.rows[rowIndex].cells[columnIndex];
        }
    }

    var calculatePossibilities = function (puzzle) {
        var enumerator = new PuzzleEnumerator(puzzle);
        while (enumerator.moveNext()) {
            var cell = enumerator.current();
            cell.possibilities = calculatePossibilitiesForCell(puzzle, cell.rowIndex, cell.columnIndex);
        }
    }

    var calculatePossibilitiesForCell = function (puzzle, row, column) {
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

    var getCellsInBlock = function (puzzle, row, column) {
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
                myCollection.add(cell);
            }
        }

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
            var possibilities = calculatePossibilitiesForCell(puzzle, rowIndex, columnIndex);
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

    var solveRecursively = function (puzzle, enumeratorIn, nesting) {
        var enumerator = new PuzzleEnumerator(puzzle);
        while (enumerator.moveNext()) {
            var cell = enumerator.current();
            if (cell.value === '') {
                //proberen
                //var possibilities = calculatePossibilitiesForCell(puzzle, cell.rowIndex, cell.columnIndex);
                calculatePossibilities(puzzle);

                log(nesting + ' - (' + cell.rowIndex + ',' + cell.columnIndex + ') heeft mogelijkheden ' + cell.possibilities.toString());

                if (cell.possibilities.count > 0) {
                    for (var index = 0; index < cell.possibilities.count; index++) {
                        var value = cell.possibilities.get(index);

                        var message = nesting + ' - (' + cell.rowIndex + ',' + cell.columnIndex + ') probeer ' + value;
                        log(message);

                        cell.value = value;

                        if (cell.rowIndex === puzzle.rows.length - 1 && cell.columnIndex === puzzle.rows[0].cells.length - 1) {
                            //alles gevuld: opgelost
                            return true;
                        }
                        //een niveau dieper gaan
                        var opgelost = solveRecursively(puzzle, enumerator, nesting + 1);
                        calculatePossibilities(puzzle);
                        log(nesting + ' - Terugkomst uit solveRecursively');
                        if (opgelost) {
                            return true;
                        }
                        else {
                            cell.value = '';
                        }
                    }
                }
                else {
                    log(nesting + ' - Geen mogelijkheden voor cel (' + cell.rowIndex + ',' + cell.columnIndex + ')');
                    return false;
                }
            }
            else {
                log(nesting + ' - (' + cell.rowIndex + ',' + cell.columnIndex + ') == ' + cell.value);
            }
        }
        throw new DOMException('niet op te lossen');
    }

    function sleep(seconds) {
        var e = new Date().getTime() + (seconds * 1000);
        while (new Date().getTime() <= e) { }
    }

    var toggleSiblings = function (puzzle, cell, onOrOff) {
        var rowIndex = cell.rowIndex;
        var columnIndex = cell.columnIndex;

        puzzle.rows.forEach(function (row) {
            row.cells.forEach(function (cell) {
                if (cell.rowIndex === rowIndex || cell.columnIndex === columnIndex) {
                    cell.hover = onOrOff;
                }
            });
        });

        var cells = getCellsInBlock(puzzle, rowIndex, columnIndex);
        cells.forEach(function (cell) {
            cell.hover = onOrOff;
        });
    }

    return {
        solvePuzzle: function (puzzle) {
            for (var rowIndex = 0; rowIndex < puzzle.rows.length; rowIndex++) {
                for (var columnIndex = 0; columnIndex < puzzle.rows[rowIndex].cells.length; columnIndex++) {
                    var cell = puzzle.rows[rowIndex].cells[columnIndex];
                    cell.rowIndex = rowIndex;
                    cell.columnIndex = columnIndex;
                }
            }

            solveRecursively(puzzle, null, 0);

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
            calculatePossibilitiesForCell();
        },

        showSiblings: function (puzzle, cell) {
            toggleSiblings(puzzle, cell, true);
        },

        hideSiblings: function (puzzle, cell) {
            toggleSiblings(puzzle, cell, false);
        }
    }
});