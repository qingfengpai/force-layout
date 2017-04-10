
/**
 * 格式化数据
 */
function format(data) {
	let new_data = [];
	let origin = [];
	data.forEach(function(item, index){
		let uids = item.chain.split(' ');
		for (let i = 0; i < uids.length; i++) {
			let curr = {
				"id": uids[i],
				"depth": i
			}
			if (i == 0) {
				if (origin.indexOf(uids[i]) == -1) {
					curr['parent'] = null;
					new_data.push({source: curr});
					origin.push(uids[i])
				}
				continue;
			}
			let prev = {
				"id": uids[i-1],
				"depth": i-1,
			}
			curr['parent'] = uids[i-1];
			let link = {
				"_lid": uids[i-1] + "_" + uids[i],
				"source": uids[i-1],
				"target": uids[i]
			}
			new_data.push({
				"source": prev,
				"target": curr,
				"link": link
			})
		}
	});
	console.log(JSON.stringify(new_data));
}
