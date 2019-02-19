var product = {
	post: function(ref, req, res){
		ref.add({
			category: [],
			description: req.body.description,
			nama_barang: req.body.nama_barang,
			informasi: req.body.informasi,
			ketentuan: req.body.ketentuan,
			price: req.body.price,
			stock: req.body.stock,
			thumbnail: req.body.thumbnail,
			ratting: req.body.ratting,
		}).then(doc=>{
			console.log("add document", doc.id)
			res.status(200).json({
				message: "success"
			})
		}).catch(err=>{
			console.log("Error", err)
		})
	},
	getAll: function(ref, req, res) {
		var dataBarang = [];
		ref.get().then(snapshot =>{
			snapshot.forEach(doc =>{
				dataBarang.push({
					id: doc.id,
					data_barang : doc.data()
				});
			});
			res.status(200).send(dataBarang)
		}).catch(err =>{
			console.log("Error", err)
		});
	},
	getId: function(ref, req, res){
		ref.doc(req.params.id).get().then(doc=>{
			if(!doc.exists){
				res.status(400).json({
					message: "data not found"
				})
			}else{
				res.status(200).json({
					result: doc.data()
				});
			}
		});
	}
}

module.exports = product;