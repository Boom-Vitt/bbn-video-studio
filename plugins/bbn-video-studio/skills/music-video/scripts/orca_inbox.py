# Wait on the bound Orca run inbox (run from the coordinator's Orca terminal). Heartbeat/status-only deliveries are
# acked automatically (status bodies appended to $ORCA_STATUS_LOG, default ./orca-status.log); exits printing the first
# delivery that holds a worker_done / escalation / question. Ack that delivery yourself after handling it.
import json, os, subprocess, sys, time
def orca(*a):
    out = subprocess.run(['orca', 'orchestration', *a, '--json'], stdin=subprocess.DEVNULL, capture_output=True, text=True).stdout
    return json.JSONDecoder().raw_decode(out.strip())[0]
while True:
    d = orca('check', '--wait', '--types', 'worker_done,escalation,question', '--timeout-ms', '540000')
    if 'result' not in d:
        print('check error:', json.dumps(d)[:300], file=sys.stderr); time.sleep(5); continue
    r = d['result']
    msgs = r.get('messages', [])
    if r.get('timedOut') or not msgs:
        continue
    for m in msgs:
        if m['type'] == 'status':
            open(os.environ.get('ORCA_STATUS_LOG', 'orca-status.log'), 'a').write(f"{m['created_at']} {m['from_handle'][-6:]} {m['subject']}: {m['body']}\n")
    real = [m for m in msgs if m['type'] not in ('heartbeat', 'status')]
    if not real:
        orca('check', '--ack', r['deliveryId']); continue
    print('DELIVERY', r['deliveryId'])
    for m in real:
        print('---', m['id'], m['type'], m['from_handle'], m['subject']); print(m['body']); print(m['payload'])
    sys.exit(0)
