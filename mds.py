from sklearn.manifold import MDS
import matplotlib.pyplot as plt
import numpy as np
import random
from sklearn.preprocessing import MultiLabelBinarizer
import pandas as pd

# 1. ランダムデータ生成
import json

with open('./data/animes.json', 'r', encoding='utf-8') as f:
    datas = json.load(f)  # 辞書型に変換


data=[]

for i in datas:
    if i["genres"]!="不明":
        data.append({
        "title": i["name"],
        "genres": i["genres"].split(", ") # 2～5ジャンルをランダム選択
    })


# 2. ワンホットエンコーディング
mlb = MultiLabelBinarizer()
genre_matrix = mlb.fit_transform([item['genres'] for item in data])

# 3. ユークリッド距離を計算する関数
def calculate_genre_distance(genre_matrix):
    num_items = genre_matrix.shape[0]
    distance_matrix = np.zeros((num_items, num_items))
    for i in range(num_items):
        for j in range(num_items):
            # ユークリッド距離を計算
            distance_matrix[i, j] = np.linalg.norm((genre_matrix[i] - genre_matrix[j]) * 100)
    return distance_matrix

custom_distance_matrix = calculate_genre_distance(genre_matrix)

# 4. MDS による次元削減
mds = MDS(n_components=2, dissimilarity="precomputed", random_state=42)
reduced_data_mds = mds.fit_transform(custom_distance_matrix)

# 5. ランダムなノードサイズを生成
random_sizes = np.random.randint(50, 500, size=len(data))  # 50〜500のランダム値

# 6. MDS 結果の可視化（ランダムサイズで色なし）
plt.figure(figsize=(100, 100))
plt.scatter(
    reduced_data_mds[:, 0],
    reduced_data_mds[:, 1],
    s=random_sizes,  # ランダム値をノードサイズに適用
    alpha=0.7
)

plt.title("MDS Visualization (Random Node Sizes)")
plt.xlabel("Dimension 1")
plt.ylabel("Dimension 2")
plt.grid(True)

plt.tight_layout()
plt.show()

