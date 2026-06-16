import json


def _prompt(gl_mod, ret):
    gl_mod.nondet.exec_prompt = lambda *a, **k: ret


def _checked(contract, gl_mod, ret):
    _prompt(gl_mod, ret)
    # empty check_url => no web access (stubbed)
    k = contract.create_will("owner must be inactive 90 days", "0xBeneficiary", "")
    contract.check_conditions(k)
    return contract.get_will(k)


def test_anchor_trigger(contract, gl_mod):
    w = _checked(contract, gl_mod, {"conditions_met": True, "reasoning": "all conditions satisfied"})
    assert w["triggered"] is True
    assert w["action"] == "trigger"


def test_anchor_hold(contract, gl_mod):
    w = _checked(contract, gl_mod, {"conditions_met": False, "reasoning": "conditions not yet met"})
    assert w["triggered"] is False
    assert w["action"] == "hold"


def test_validator_rejects_bad_inputs(contract, gl_mod):
    _checked(contract, gl_mod, {"conditions_met": True, "reasoning": "all conditions satisfied"})
    v = gl_mod.vm._last_validator
    R = gl_mod.vm.Return
    assert v(object()) is False
    assert v(R("not valid json")) is False
    # conditions_met not a real bool (int guard)
    assert v(R(json.dumps({"conditions_met": 1, "action": "trigger", "reasoning": "xxxxxxxx"}))) is False
    # bad action enum
    assert v(R(json.dumps({"conditions_met": True, "action": "go", "reasoning": "xxxxxxxx"}))) is False
    # cross-field invariant broken
    assert v(R(json.dumps({"conditions_met": True, "action": "hold", "reasoning": "xxxxxxxx"}))) is False
    assert v(R(json.dumps({"conditions_met": False, "action": "trigger", "reasoning": "xxxxxxxx"}))) is False
    # reasoning too short
    assert v(R(json.dumps({"conditions_met": True, "action": "trigger", "reasoning": "short"}))) is False
    # fully valid
    assert v(R(json.dumps({"conditions_met": True, "action": "trigger", "reasoning": "long enough reason"}))) is True
    assert v(R(json.dumps({"conditions_met": False, "action": "hold", "reasoning": "long enough reason"}))) is True


def test_normalized_output_always_validates(contract, gl_mod):
    # Model returns a string instead of a bool; leader normalizes to a real bool.
    _prompt(gl_mod, {"conditions_met": "true", "reasoning": "the trigger condition holds"})
    k = contract.create_will("conditions text", "0xB", "")
    contract.check_conditions(k)  # raises if normalized output failed validation
    out = gl_mod.vm._last_leader()
    assert gl_mod.vm._last_validator(gl_mod.vm.Return(out)) is True
    data = json.loads(out)
    assert data["conditions_met"] is True
    assert data["action"] == "trigger"
