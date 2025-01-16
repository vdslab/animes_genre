import json

def get_anime_name(filepath):
    """アニメ名を JSON ファイルから取得"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

months=["01","02","03","04","05","06","07","08","09","10","11","12"]

nodes=get_anime_name("./public/data/node.json")

data=list()
for i in range(len(nodes)):
    viewCount=0
    commentCount=0
    likeCount=0
    videoCount=0
    for m in range(2006,2026):
        for n in months:
            viewCount+=nodes[i]["viewCount"][str(m)][n]
            commentCount+=nodes[i]["commentCount"][str(m)][n]
            likeCount+=nodes[i]["likeCount"][str(m)][n]
            videoCount+=nodes[i]["videoCount"][str(m)][n]
    data.append({"animename":nodes[i]["animename"],"viewCount":viewCount,"commentCount":commentCount,"likeCount":likeCount,"videoCount":videoCount})

with open("./public/data/data_All.json", 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=4)