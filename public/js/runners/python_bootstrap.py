"""python_bootstrap.py
This small Python file is loaded into Pyodide (Python inside the browser)
before any student code runs. It gives us ONE function, run_user_code(),
that runs a student's program like `python file.py` would, and shows errors
the way students see them on their own computer.
"""
import sys
import traceback


def run_user_code(source, filename):
    """Run `source` as a script named `filename`. Returns 0 if it finished, 1 if it crashed."""
    # A fresh, empty "page" for the student's variables, so one run can never
    # leak into the next, and can't overwrite our own helper functions.
    namespace = {"__name__": "__main__", "__file__": filename}

    try:
        code = compile(source, filename, "exec")
        exec(code, namespace)
        return 0

    except SystemExit as stop:
        # exit() / sys.exit(): a normal way to finish. A non-zero code means "failed".
        if stop.code is None or stop.code == 0:
            return 0
        if not isinstance(stop.code, int):
            print(stop.code, file=sys.stderr)
        return 1

    except BaseException as error:  # noqa: BLE001 - we want to show every kind of error
        # error.__traceback__ starts with OUR exec() line. Skip it with
        # .tb_next so the student only sees their own file's lines.
        trace = error.__traceback__.tb_next if error.__traceback__ else None
        sys.stderr.write("".join(traceback.format_exception(type(error), error, trace)))
        if isinstance(error, EOFError):
            sys.stderr.write(
                "\nHint: the program asked for more input than you typed.\n"
                "Add more lines in the Input tab (one line for each input()).\n"
            )
        return 1

    finally:
        # Make sure text printed WITHOUT a newline at the end still appears.
        sys.stdout.flush()
        sys.stderr.flush()
