"""Adapter check / Vérification adaptateur / Verificación adaptador."""
import numpy as np
from gymnasium.utils.env_checker import check_env
from microfabgym import MicroFabEnv

env = MicroFabEnv()
try:
    check_env(env, skip_render_check=True)
    obs, _ = env.reset(seed=42)
    assert obs[3] == 0
    obs, reward, terminated, truncated, _ = env.step(np.array([2.0, 0.5], dtype=np.float32))
    assert obs[3] == 0
    obs, _, _, _, _ = env.step(np.array([1.0, 0.0], dtype=np.float32))
    assert obs[3] == 1
    _, _, terminated, truncated, info = env.step(np.array([0.0, 0.0], dtype=np.float32))
    assert terminated and not truncated and "result" in info
    print("FR : adaptateur vérifié. EN: adapter verified. ES: adaptador verificado.")
finally:
    env.close()
