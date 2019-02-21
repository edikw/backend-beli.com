

var index = {
	getById: function(ref, req, res){
		ref.doc(req.params.id).get().then(doc =>{
			if(!doc.exists){
				console.log("Data Not Found")
				res.status(400).json({
					status : "data not found"
				})
			}else {
				// console.log("document data:", doc.data())
				res.status(200).json({
					result: doc.data()
				})
			}
		}).catch(err=>{
			console.log("Error", err)
		})		
	},
	// postCartId: function(ref, a, req, res){
	// 	var dataChart = [];
	// 	ref.doc(req.params.id).get().then(doc =>{
	// 		if(!doc.exists){
	// 			res.status(400).json({
	// 				status : "data not found"
	// 			})
	// 		}else {
	// 			if(doc.data().chart.length > 0){
	// 				doc.data().chart.map(data=>{
	// 					if(data.id_barang == req.body.id_barang){
	// 						res.status(400).json({
	// 							message: 'barang sudah ada'
	// 						});
	// 						console.log('barang sudah ada')
	// 					}else {
	// 						dataChart.push(data)
	// 						addChart(doc.id);
	// 					}
	// 				});
	// 			}else {
	// 				addChart(doc.id)
					
	// 			}

	// 		}
	// 	});

	// 	function addChart(x){
	// 		a.add({
	// 			id_pembeli: x,
	// 			id_barang: req.body.id_barang
	// 		}).then(doc=>{
	// 			dataChart.push({
	// 				id_chart: doc.id,
	// 				id_barang: req.body.id_barang
	// 			});

	// 			ref.doc(req.params.id).update({
	// 				"chart": 
	// 					dataChart
	// 			}).then(doc => {
	// 				res.status(200).json({
	// 					message: "success"
	// 				})
	// 			}).catch(err => {
	// 				console.log('Error', err)
	// 			})
	// 		}).catch(err=>{
	// 			console.log("Error", err)
	// 		})
	// 	}
	// },
	postUser: function(ref, req,res){
		ref.add({
				username: req.body.username,
				fullname: null,
				password: req.body.password,
				email: req.body.email,
				alamat: null,
				birthday: null,
				active: 'active',
				verified: 'verified',
				chart: [],
				token: null,
				token_expired: null,
				transaksi:[]
		})
		.then((snapshot) => {
	    	console.log('User added: ', snapshot.id)
	    	res.status(200).json({
	    		message: 'Berhasil register'
	    	});
		})
		.catch((err) => {
		    console.log('Error adding user', err);
		});
	}
}

module.exports = index;