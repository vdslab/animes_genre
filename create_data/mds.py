from sklearn.manifold import MDS
import matplotlib.pyplot as plt
import numpy as np
import random
from sklearn.preprocessing import MultiLabelBinarizer
import pandas as pd

# 1. ランダムデータ生成
import json

with open('./data/animes_tests.json', 'r', encoding='utf-8') as f:
    datas = json.load(f)  # 辞書型に変換


data=[]
filedata=[]

for i in datas["anime_data"]:
    if i["genres"] != "不明":
        genres = i["genres"]
        if isinstance(genres, str):  # genres が文字列の場合
            genres = genres.split(", ")
        data.append({
            "title": i["name"],
            "genres": genres
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

for i in range(len(reduced_data_mds)):
    filedata.append(
        {"animename":datas["anime_data"][i]["name"],
         "coverImage":datas["anime_data"][i]["coverImage"],
         "x":float(reduced_data_mds[i, 0]),
         "y":float(reduced_data_mds[i, 1]),
         "year": datas["anime_data"][i]["year"],
         "n": datas["anime_data"][i]["n"],
         "description":datas["anime_data"][i]["description"],
         "startDate":datas["anime_data"][i]["startDate"],
         "endDate":datas["anime_data"][i]["endDate"],
         "studio":datas["anime_data"][i]["studio"],
        "link":datas["anime_data"][i]["link"],
        "viewCount":datas["anime_data"][i]["viewCount"],
        "likeCount":datas["anime_data"][i]["likeCount"],
        "commentCount":datas["anime_data"][i]["commentCount"],
        "videoCount":datas["anime_data"][i]["videoCount"],
         "color":"blue"
         })

with open('./data/node.json', 'w', encoding='utf-8') as f:
        json.dump(filedata, f, ensure_ascii=False, indent=4)

# print(filedata)

# # 6. MDS 結果の可視化（ランダムサイズで色なし）
# plt.figure(figsize=(100, 100))
# plt.scatter(
#     reduced_data_mds[:, 0],
#     reduced_data_mds[:, 1],
#     s=random_sizes,  # ランダム値をノードサイズに適用
#     alpha=0.7
# )

# plt.title("MDS Visualization (Random Node Sizes)")
# plt.xlabel("Dimension 1")
# plt.ylabel("Dimension 2")
# plt.grid(True)

# plt.tight_layout()
# plt.show()

