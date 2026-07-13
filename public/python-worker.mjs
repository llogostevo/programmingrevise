import { loadPyodide } from "/pyodide/pyodide.mjs";

let pyodidePromise;
let queue = Promise.resolve();

const runnerSource = String.raw`
import builtins, io, json, sys

_student_inputs = json.loads(__procedural_inputs)
_student_input_index = 0
_old_stdout = sys.stdout
_old_input = builtins.input
_buffer = io.StringIO()

def _procedural_input(prompt=""):
    global _student_input_index
    if _student_input_index >= len(_student_inputs):
        raise EOFError("No more test input was available.")
    value = _student_inputs[_student_input_index]
    _student_input_index += 1
    return value

sys.stdout = _buffer
builtins.input = _procedural_input
_scope = {"__builtins__": builtins}

try:
    exec(compile(__procedural_code, "<student>", "exec"), _scope)
    _captured = {}
    for _name in json.loads(__procedural_capture):
        if _name not in _scope:
            _captured[_name] = None
        else:
            _value = _scope[_name]
            _captured[_name] = _value if isinstance(_value, (str, int, float, bool)) or _value is None else str(_value)
    __procedural_result = json.dumps({"ok": True, "output": _buffer.getvalue(), "variables": _captured, "inputsConsumed": _student_input_index})
except SyntaxError as error:
    __procedural_result = json.dumps({
        "ok": False,
        "output": _buffer.getvalue(),
        "errorType": "syntax",
        "error": f"Line {error.lineno}: {error.msg}",
    })
except Exception as error:
    __procedural_result = json.dumps({
        "ok": False,
        "output": _buffer.getvalue(),
        "errorType": "runtime",
        "error": f"{type(error).__name__}: {error}",
    })
finally:
    sys.stdout = _old_stdout
    builtins.input = _old_input

__procedural_result
`;

async function getPyodide() {
  if (!pyodidePromise) pyodidePromise = loadPyodide({ indexURL: "/pyodide/" });
  return pyodidePromise;
}

async function execute(message) {
  try {
    const pyodide = await getPyodide();
    pyodide.globals.set("__procedural_code", message.code);
    pyodide.globals.set("__procedural_inputs", JSON.stringify(message.inputs));
    pyodide.globals.set("__procedural_capture", JSON.stringify(message.captureVariables));
    const raw = await pyodide.runPythonAsync(runnerSource);
    self.postMessage({ id: message.id, result: JSON.parse(String(raw)) });
  } catch (error) {
    self.postMessage({
      id: message.id,
      result: {
        ok: false,
        output: "",
        errorType: "runtime",
        error: error instanceof Error ? error.message : "Python could not start in this browser.",
      },
    });
  }
}

self.onmessage = (event) => {
  queue = queue.then(() => execute(event.data));
};
