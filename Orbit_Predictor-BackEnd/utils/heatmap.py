import pandas as pd
import matplotlib.pyplot as plt

data = {} # Any repsonse dictionary we get from the api

df = pd.DataFrame(data["heatmap_data"])
heatmap_md = df.pivot(index='T_hours', columns='dv', values='miss_distance')
heatmap_pc = df.pivot(index='T_hours', columns='dv', values='pc')

def plot_heatmap(heatmap, value_label, title):
    T_hours_vals = heatmap.index.values.astype(float)
    dv_vals = heatmap.columns.values.astype(float)
    
    heatmap_transposed = heatmap.T

    plt.figure(figsize=(10, 6))
    plt.imshow(heatmap_transposed.values, aspect='auto', origin='lower',
               extent=[T_hours_vals.min(), T_hours_vals.max(), dv_vals.min(), dv_vals.max()])
    plt.colorbar(label=value_label)
    plt.xlabel('T_hours')
    plt.ylabel('Delta-V')
    plt.title(title)
    plt.show()

plot_heatmap(heatmap_md, 'Miss Distance', 'Heatmap of Miss Distance (T_hours vs Delta-V)')

plot_heatmap(heatmap_pc, 'Probability of Collision', 'Heatmap of PC (T_hours vs Delta-V)')