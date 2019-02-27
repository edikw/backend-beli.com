var index = {
	search: function( ref, req, res){
		var result = []
		var data = []
		ref.get().then(snapshot => {
			snapshot.forEach(doc => {
				data.push({
					id:doc.id,
					data: doc.data()})	
			})

			checkSearch(data ,function(result){
				if(result.unique == true){
					res.status(200).json({
						result: result.result
					})	
				}else {
					res.status(400).json({
						message: result.result
					})
				}
			}) 
		});



		function checkSearch(data, callback){
			var unique;
			var dataResult = []
			for (var i = 0; i < data.length; i++) {
				if(req.body.search.toLowerCase() == data[i].data.nama_barang.toLowerCase() || data[i].data.nama_barang.toLowerCase().indexOf(req.body.search.toLowerCase()) !== -1){
					unique = true
					dataResult.push(data[i])
	              }else {
	              	unique = false;
	              }
			}
			if(dataResult.length >0){
				callback({
					unique: true,
					result: dataResult
				});
			}else {
				callback({
					unique: false,
					result: "Data tidak ada"
				})			
				
			}
		}
	}
}

module.exports = index;