# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
import json
from genlayer import *

class WillExecutor(gl.Contract):
    wills: TreeMap[str, str]
    will_count: u256

    def __init__(self):
        self.will_count = u256(0)

    @gl.public.write
    def create_will(self, conditions: str, beneficiary: str, check_url: str) -> str:
        key = str(int(self.will_count))
        will = {"owner": str(gl.message.sender_address), "conditions": str(conditions).strip()[:2000], "beneficiary": str(beneficiary).strip(), "check_url": str(check_url).strip(), "triggered": False, "reasoning": "", "checks": 0}
        self.wills[key] = json.dumps(will)
        self.will_count += u256(1)
        return key

    @gl.public.write
    def check_conditions(self, key: str) -> None:
        key = str(key)
        if key not in self.wills: raise Exception("unknown")
        will = json.loads(self.wills[key])
        if will["triggered"]: raise Exception("already triggered")
        verdict = self._check(will)
        will["checks"] += 1; will["reasoning"] = verdict["reasoning"]
        if verdict["conditions_met"]: will["triggered"] = True
        self.wills[key] = json.dumps(will)

    def _check(self, will):
        def leader_fn() -> str:
            context = "(no data)"
            if will["check_url"].startswith("http"):
                try: context = gl.nondet.web.get(will["check_url"]).body.decode("utf-8")[:4000]
                except: pass
            prompt = f"""Check if conditions for a digital will are met.\nCONDITIONS: {will['conditions']}\nCONTEXT:\n{context}\n\nReply JSON: {{"conditions_met": true/false, "reasoning": "<brief>"}}"""
            raw = gl.nondet.exec_prompt(prompt, response_format="json")
            return json.dumps(raw) if isinstance(raw, dict) else str(raw).strip()
        def validator_fn(r) -> bool:
            if not isinstance(r, gl.vm.Return): return False
            try: return isinstance(json.loads(r.calldata).get("conditions_met"), bool)
            except: return False
        return json.loads(gl.vm.run_nondet_unsafe(leader_fn, validator_fn))

    @gl.public.view
    def get_will(self, key: str) -> dict:
        key = str(key)
        if key not in self.wills: return {"exists": False}
        return json.loads(self.wills[key])

    @gl.public.view
    def read_trigger(self, key: str) -> dict:
        key = str(key)
        if key not in self.wills: return {"triggered": False}
        w = json.loads(self.wills[key])
        return {"triggered": w["triggered"], "beneficiary": w["beneficiary"]}

    @gl.public.view
    def stats(self) -> dict:
        return {"total_wills": int(self.will_count)}
