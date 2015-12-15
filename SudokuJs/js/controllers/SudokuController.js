﻿'use strict';

sudokuJs.controller('SudokuController', function SudokuController($scope, sudokuLoader, sudokuSolver, ngDialog, httpLogger, $timeout) {
    this.sudokuLoader = sudokuLoader;

    sudokuLoader.getPuzzle('easy').$promise
        .then(function (puzzle) {
            $scope.puzzle = puzzle;

            var enumerator = new PuzzleEnumerator($scope.puzzle);
            while (enumerator.moveNext()) {
                var cell = enumerator.current();
                if (cell.value) {
                    enumerator.current().given = 'given';
                }
            }

            console.log('Puzzle loaded: ');
            console.log(puzzle)
        })
        .catch(function (response) { console.log(response); });

    $scope.solveSudoku = function () {
        //sudokuSolver.solvePuzzle($scope.puzzle);
        solvePuzzle($scope.puzzle);
    };

    $scope.showPossibilities = function () {
        sudokuSolver.showPossibilities();
    };

    $scope.newSudoku = function () {
        console.log('new sudoku');
        //sudokuLoader.getPuzzle('empty9by9puzzle').$promise
        //.then(function (puzzle) { $scope.puzzle = puzzle; console.log('Puzzle loaded: '); console.log(puzzle) })
        //.catch(function (response) { console.log(response); });
        $scope.puzzle.rows.forEach(function (row) {
            row.cells.forEach(function (cell) {
                cell.value = '';
                cell.given = '';

            });
        });
        $scope.puzzle.name = '';
    };

    //$scope.openSudokuDialog = function () {
    //    ngDialog.open({ template: 'openDialog', controller: 'SudokuController' });
    //};

    $scope.openSudoku = function (name) {
        //ngDialog.close({ template: 'saveDialog' });
        sudokuLoader.getPuzzle(name).$promise
        .then(function (puzzle) {
            $scope.puzzle = puzzle;
            console.log('Puzzle loaded: '); console.log(puzzle)
        })
        .catch(function (response) { console.log(response); });
    };

    $scope.saveSudokuDialog = function () {
        ngDialog.open({ template: 'saveDialog', controller: 'SudokuController' });
    };

    $scope.saveSudoku = function (name) {
        ngDialog.close({ template: 'saveDialog' });
        $scope.puzzle.name = name;
        sudokuLoader.savePuzzle($scope.puzzle).$promise
        .then(function (event) { console.log('success', event) })
               .catch(function (event) { console.log('failure', event) });
    };

    var solveRecursively = function (puzzle, enumeratorIn, nesting) {
        var enumerator = new PuzzleEnumerator(puzzle);
        while (enumerator.moveNext()) {
            var cell = enumerator.current();
            if (cell.value === '') {
                //proberen
                var possibilities = calculatePossibilities(puzzle, cell.rowIndex, cell.columnIndex);

                log(nesting + ' - (' + cell.rowIndex + ',' + cell.columnIndex + ') heeft mogelijkheden ' + possibilities.toString());

                if (possibilities.count > 0) {
                    for (var index = 0; index < possibilities.count; index++) {
                        var value = possibilities.get(index);

                        var message = nesting + ' - (' + cell.rowIndex + ',' + cell.columnIndex + ') probeer ' + value;
                        log(message);

                        cell.value = value;

                        if (cell.rowIndex === puzzle.rows.length - 1 && cell.columnIndex === puzzle.rows[0].cells.length - 1) {
                            //alles gevuld: opgelost
                            return true;
                        }
                        //een niveau dieper gaan
                        var opgelost = solveRecursively(puzzle, enumerator, nesting + 1);
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
                    log(nesting + ' - Geen mogelijkheden voor cel ' + cell.rowIndex + '-' + cell.columnIndex);
                    return false;
                }
            }
            else {
                log(nesting + ' - (' + cell.rowIndex + ',' + cell.columnIndex + ') == ' + cell.value);
            }
        }
        throw new DOMException('niet op te lossen');
    }

    var solvePuzzle = function (puzzle) {
        for (var rowIndex = 0; rowIndex < puzzle.rows.length; rowIndex++) {
            for (var columnIndex = 0; columnIndex < puzzle.rows[rowIndex].cells.length; columnIndex++) {
                var cell = puzzle.rows[rowIndex].cells[columnIndex];
                cell.rowIndex = rowIndex;
                cell.columnIndex = columnIndex;
            }
        }

        solveRecursively(puzzle, null, 0);
        
      


        addValue();

      
    }

    var addValue = function () {
        var enumerator = new PuzzleEnumerator($scope.puzzle);
        while (enumerator.moveNext()) {
            var cell = enumerator.current();
            if (cell.value === '') {
                cell.value = 9;
                log('(' + cell.rowIndex + ', ' + cell.columnIndex + ')');
                $timeout(function () {
                    addValue();
                }, 500);
                return;
            }
        }
    }

    var teller = 0;
    var log = function (text) {
        var paddedText = teller +  '|\'' + text + '\'';
        httpLogger.savePuzzle({ name: paddedText });
//        console.log(paddedText);
        teller++;
    }

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
    function sleep(seconds) {
        var e = new Date().getTime() + (seconds * 1000);
        while (new Date().getTime() <= e) { }
    }
});