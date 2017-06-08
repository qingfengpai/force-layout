# coding: utf-8

import csv
import json

def output(name, data):
	with open(name + '.json', 'w', encoding='utf-8') as f:
		f.write(json.dumps(data))


# {'1497390470': {"sex": "m", "id": "1497390470", "v": "1", "pro": "11"}}
users = {}

# [{source:4059263678303661, target:4059263959778258, time: 1483287341, uid: 1497390470}]
links = []

nodes = {}

file_key = "b76cde"
with open('weiboevent-' + file_key + '.csv', 'r', encoding='utf-8') as f:
	f_csv = csv.reader(f)
	headers = next(f_csv)
	for row in f_csv:
		wbid = row[0]	# 微博id
		uid = row[2]	# 微博用户id
		parent = row[3]	# parent weibo id
		time = int(row[4])   # 微博时间
		text = row[8]	# 转发文本
		followers = row[11]	# 粉丝数
		friends = row[15]	# 关注数
		name = row[16]	# 用户名
		sex  = row[19]	# 性别
		pro  = row[20]	# 省份
		v    = row[22]	# 是否大V
		location = row[25]	# 地址
		avatar = row[26]	# 头像
		if v == '' : v = '0'

		link = {
			'parent': parent,
			'id': wbid,
			'time': time,
			'uid': uid
		}
		links.append(link)

		user = {
			'uid': uid,
			'sex': sex,
			'v': v,
			'followers': followers,
			'name': name,
			'friends': friends,
			'province': pro,
			'location': location,
			'avatar': avatar
		}
		users[uid] = user

		node = {
			'id': wbid,
			'text': text
		}
		nodes[wbid] = node

	output("links-" + file_key, links)
	output("users-" + file_key, users)
	output("nodes-" + file_key, nodes)

	print ("done")

