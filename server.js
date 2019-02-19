const express = require('express');
const app = express();
var bodyParser = require('body-parser');
const crypto =  require('crypto-js');
var jwt = require('jsonwebtoken');
var cors = require('cors');
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const db = require('./firebase.js');


app.listen(3000, function(){
	console.log("run port 3000")
});
var docRefUser = db.collection('users');
var docRefChart = db.collection('chart');
var docRefPenjual = db.collection('penjual');
var docRefBarang = db.collection('barang');
var docRefTransaksi = db.collection('transaksi');
var docRefCategory = db.collection('category');
var docRefBanner = db.collection('banner');

var userController = require('./controller/user.js');
var productController = require('./controller/product.js');
var bannerController = require('./controller/banner.js');
var cartController = require('./controller/cart.js');

app.all('/*', (req, res, next)=>{
	res.header({
	  "origin": "*",
	  "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
	  "preflightContinue": false,
	  "optionsSuccessStatus": 204
	})
	next();
});

app.post('/register', (req, res, next) => {
	var usernameExist
	var emailExist

	var getRefUserEmail = docRefUser.where('email', '==', req.body.email)
	var getRefUserUsername = docRefUser.where('username', '==', req.body.username)
	// const hashPassword = crypto.AES(req.body.password)
	// console.log('hass', hashPassword)
	// var inputID

	async function registerUser() {
		try {

		await getRefUserUsername.get().then(snapshot => {
			snapshot.forEach(doc => {
				usernameExist = doc.data()
			})
		})

		await getRefUserEmail.get().then(snapshot => {
			snapshot.forEach(doc => {
				emailExist = doc.data()
			})
		})

		if (usernameExist) {
			res.status(400).json({
				status: 'Failed',
				message: 'Username exist'
			})
			console.log('username sudah ada')
		}
		else if (emailExist) {
			res.status(400).json({
				status: 'Failed',
				message: 'Email exist'
			})
			console.log('Email sudah ada')
		} 
		else if (emailExist && usernameExist) {
			res.status(400).json({
				status: 'Failed',
				message: 'Username and Email exist'
			})
			console.log('username dan email sudah ada')
		} else {
			userController.postUser(docRefUser, req, res);
		}

		} catch (err) {
			console.log('Opps, error', err)
		}
	}
	registerUser();
});

app.post('/login', (req, res, next) => {
	var email;
	var password;
	var userID;

	var getRefUserPasword = docRefUser.where('password', '==', req.body.password)
	var getRefUserEmail = docRefUser.where('email', '==', req.body.email)
	
	async function login(){
		try {
			await getRefUserPasword.get().then(snapshot => {
				snapshot.forEach(doc => {
					password = doc.data().password;
				})
			});
			await getRefUserEmail.get().then(snapshot => {
				snapshot.forEach(doc => {
					email = doc.data().email;
					userID = doc.id;

				})
			});
			if(password == req.body.password && email == req.body.email){
				valid(password, email, userID);
			}
			else {
				invalid();
			}
		} catch (err){
			console.log('error', err)
		}
	}

	login();

	function valid(password, email, id){
		var token = jwt.sign({user:password, email, id}, 'secretkey')
		res.send({
			status: 200,
			message: 'success',
			id: id,
			token: token
		})
	}

	function invalid(){
		res.status(403).send({
			status: 403,
			message: 'username atau password salah'
		});
	}
});

app.get('/users/:id', (req, res, next) => {
	userController.getById(docRefUser, req, res);
});

app.post('/product', (req,res,next) => {
	productController.post(docRefBarang, req, res);
});

app.get('/product', (req, res, next)=> {
	productController.getAll(docRefBarang, req, res)
});

app.get('/product/:id', (req,res, next)=>{
	productController.getId(docRefBarang, req, res);
});

app.post('/user/chart/:id', (req, res, next)=>{
	userController.postCartId(docRefUser, docRefChart, req, res);
});

app.get('/chart/:id', (req, res)=>{
	cartController.getId(docRefChart, req, res);
});

app.get('/chart/user/:id', (req, res, next)=> {
	var idCart = [];
	var x = [];
	var idBarang = []

	docRefUser.doc(req.params.id).get().then(doc => {
		if(doc.data().chart.length > 0){
			doc.data().chart.map(cart => {
				idCart.push(cart.id_barang);
			});

			docRefBarang.get().then(snapshot => {
				snapshot.forEach(doc => {
					if(!doc.exists){
						res.status(400).json({
							status: "data not found"
						})
					}else {
						idCart.map(data =>{
							if(data == doc.id){
								console.log(doc.data())
								x.push({
									id: doc.id,
									data:doc.data()
								})
							}
						});
					}
				});
					res.status(200).json({
						result: x
					});
			})
		}
	});
});

// BELUM SIAP
app.delete('/chart/user/:id', (req, res, next)=> {
	docRefUser.doc(req.params.id).get().then(doc =>{
		if(!doc.exists){
			console.log("Data Not Found")
			res.status(400).json({
				status : "data not found"
			})
		}else{

		}
	})
});

app.get('/banner', (req,res,next)=> {
	bannerController.getAll(docRefBanner, req, res);
});

app.post('/user/transaksi/:id', (req, res)=>{

	var dataTransaksi = [];
	docRefUser.doc(req.params.id).get().then(doc =>{
		if(!doc.exists){
			console.log("Data Not Found")
			res.status(400).json({
				status : "data not found"
			})
		}else{
			if(doc.data().transaksi.length > 0){
				doc.data().transaksi.map(data => {
					console.log(data)
					dataTransaksi.push(data)
				});
				postTransaksi(doc.id)
			}else{
				postTransaksi(doc.id)
			}
		}
	});

	function postTransaksi(a){
		docRefTransaksi.add({
				id_barang: req.body.id_barang,
				id_user: a,
				jumlah_barang: req.body.jumlah_barang,
				total_harga: req.body.total_harga,
				verified: false,
				bank: req.body.bank,
				kurir: req.body.kurir,
				alamat_penerima: req.body.alamat_penerima,
				email: req.body.email,
				no_handphone: req.body.no_handphone,
				catatan: req.body.catatan,
				nama_penerima: req.body.nama_penerima
			}).then(ref => {
				dataTransaksi.push({
					id_transaksi: ref.id,
					id_barang: req.body.id_barang
				});
				updateUserTransaksi(ref.id);
			}).catch(err => {
				res.status(400).json({
					message: 'Failed'. err
				})
			})
	}

	function updateUserTransaksi(x){
		docRefUser.doc(req.params.id).update({
			"transaksi": dataTransaksi
		})
		res.status(200).json({
			message: 'success',
			id_transaksi: x
		});
	}
});

app.get('/transaksi/:id', (req,res, next)=> {
	docRefTransaksi.doc(req.params.id).get().then(doc=>{
		if(!doc.exists){
			res.status(400).json({
				status: "data not found"
			})
		}else{
			res.status(200).json({
				result: doc.data()
			});
		}
	});
});

app.get('/user/transaksi/:id', (req,res,next)=> {
	var transaksi = [];
	var result = [];
	docRefUser.doc(req.params.id).get().then(doc=> {
		if(!doc.exists){
			res.status(400).json({
				status: "data not found"
			})
		}else{
			doc.data().transaksi.map(dataTransaksi => {
				transaksi.push(dataTransaksi.id_transaksi)
			});
			console.log(transaksi)
			getTransaksi();
		}

		function getTransaksi() {
			docRefTransaksi.get().then(snapshot =>{
				snapshot.forEach(doc =>{
					transaksi.map(dataTransaksi =>{
						if(doc.id == dataTransaksi){
							result.push({
								id_transaksi: doc.id,
								data: doc.data()})
						}
						
					})
				});
				docRefBarang.get().then(snapshot =>{
					snapshot.forEach(doc =>{
						result.map(data =>{
							if(doc.id === data.data.id_barang){
								var barang = ({
									id_barang: doc.id,
									barang: doc.data()})

								data.data.id_barang = barang
							}
						})
					});
					res.status(200).json({
						result: result
					})
				})
			})
		}
	})
});




// app.get('/users', (req, res)=>{
// 	var dataUsers = []
// 	docRefUser.get()
//     .then(snapshot => {
//       snapshot.forEach(doc => {
// 	      dataUsers.push({
// 	      	id: doc.id,
// 	      	data_user: doc.data()})
// 	      console.log(doc.id, '=>', doc.data());
//       });
// 	    	res.status(200).send({
// 	    		result: dataUsers
// 	    	})
//     })
//     .catch(err => {
//       console.log('Error getting documents', err);
//     });
// });

// app.get('/users/:id', (req, res)=>{
// 	docRefUser.doc(req.params.id).get().then(doc =>{
// 		if(!doc.exists){
// 			console.log("Data Not Found")
// 			res.status(400).json({
// 				status : "data not found"
// 			})
// 		}else {
// 			console.log("document data:", doc.data())
// 			res.status(200).json({
// 				result: doc.data()
// 			})
// 		}
// 	}).catch(err=>{
// 		console.log("Error", err)
// 	})
// });


// app.post('/users', (req, res)=>{
// 	docRefUser.add({
// 		fullname : req.body.fullname,
// 		username : req.body.username,
// 		email : req.body.email,
// 		password : req.body.password,
// 		alamat : req.body.alamat,
// 		chart: req.body.chart

// 	}).then(ref=>{
// 		console.log("add document", ref.id)
// 		res.status(200).json({
// 			message: "success"
// 		})
// 	}).catch(err=>{
// 		console.log("Error", err)
// 	})
// });

// app.put('/profile/users/:id', (req, res)=>{
// 	docRefUser.doc(req.params.id).update({
// 		fullname : req.body.fullname,
// 		username : req.body.username,
// 		email : req.body.email,
// 		password : req.body.password,
// 		alamat: req.body.alamat
// 	}).then(()=>{
// 		console.log("update data")
// 		res.status(200).json({
// 			message: "success"
// 		})
// 	}).catch(err=>{
// 		console.log("Error", err)
// 	})
// });

// app.delete('/users/:id', (req,res)=>{
// 	docRefUser.doc(req.params.id).delete().then(()=>{
// 		console.log("delete file")
// 		res.status(200).json({
// 		status: "delete success"
// 	}).catch(err=>{
// 		console.log("Error", err)
// 		})
// 	})
// });

// TAMBAH CART



// app.get('/chart', (req, res)=>{
// 	var dataChartAll = [];
// 	docRefChart.get().then(snapshot=>{
// 		snapshot.forEach(doc=>{
// 			dataChartAll.push({
// 				id: doc.id,
// 				data_chart: doc.data()
// 			})
// 		});
// 		res.status(200).send(dataChartAll)
		
// 		}).catch(err =>{
// 			console.log("Error", err)
// 	});
// });


// app.get('/penjual', (req,res)=> {
// 	var dataPenjual = [];
// 	docRefPenjual.get().then(snapshot=>{
// 		snapshot.forEach(doc =>{
// 			dataPenjual.push({
// 				id: doc.id,
// 				data_penjual: doc.data()})
			
// 			console.log("data penjual", doc.data())
// 		})
// 		res.status(200).send(dataPenjual)

// 	}).catch(err =>{
// 		console.log('Error', err)
// 	})
// });

// app.get('/penjual/:id', (req,res)=>{
// 	docRefPenjual.doc(req.params.id).get().then(doc=>{
// 		if(!doc.exists){
// 			res.status(400).json({
// 				message: "data not found"
// 			})
// 		}else{
// 			res.status(200).json({
// 				result: doc.data()
// 			});
// 		}
// 	});
// });

// app.post('/penjual', (req, res)=> {
// 	docRefPenjual.add({
// 		username : req.body.username,
// 		fullname : req.body.fullname,
// 		email: req.body.email,
// 		password: req.body.password,
// 		alamat: req.body.alamat,
// 		nama_lapak: req.body.nama_lapak,
// 		ratting: req.body.alamat,
// 		barang: req.body.barang,
// 		transaksi: req.body.transaksi
// 	}).then(ref =>{
// 		console.log("add penjual", ref.id)
// 		res.status(200).json({
// 			message: "success"
// 		})
// 	}).catch(err =>{
// 		console.log("Error", err)
// 	})
// });

// app.put('/profile/penjual/:id', (req,res)=>{
// 	docRefPenjual.doc(req.params.id).update({
// 		username : req.body.username,
// 		fullname : req.body.fullname,
// 		email: req.body.email,
// 		password: req.body.password,
// 		alamat: req.body.alamat,
// 		nama_lapak: req.body.nama_lapak,
// 	}).then(ref=>{
// 		console.log("update data", ref.id)
// 		res.status(200).json({
// 			message: "success"
// 		})
// 	}).catch(err =>{
// 		console.log("Error", err)
// 	})
// });

// app.post('/penjual/barang/:id', (req,res)=>{
// 	var dataIdBarang=[]
// 	docRefPenjual.doc(req.params.id).get().then(doc =>{
// 		if(!doc.exists){
// 			console.log("Data Not Found")
// 			res.status(400).json({
// 				status : "data not found"
// 			})
// 		}else{
// 			doc.data().barang.map(e=>{
// 				dataIdBarang.push(e)
// 			})

// 			docRefBarang.add({
// 				nama_barang: req.body.nama_barang,
// 				description: req.body.description,
// 				thumbnail: req.body.thumbnail,
// 				price: req.body.price,
// 				ratting: req.body.ratting,
// 				stock : req.body.stock,
// 				category: req.body.category,
// 				penjual: doc.id
// 			}).then(ref=>{
// 				console.log("add barang", ref.id)
// 				dataIdBarang.push({
// 					id_barang: ref.id
// 				})
// 				docRefPenjual.doc(req.params.id).update({
// 					"barang": 
// 						dataIdBarang
// 				}).then(()=>{
// 					res.status(200).json({
// 						message: "success"
// 					})					
// 				}).catch(err =>{
// 				console.log("Error", err)
// 				})
// 			})
// 		}
// 	})
// });







			// docRefPenjual.get().then(snapshot=>{
			// 	snapshot.forEach(doc=>{
			// 		doc.data().barang.map(data=>{
			// 			if(data.id_barang == req.body.id_barang){
			// 				dataPenjualTransaksi = doc.id
			// 				docRefTransaksi.add({
			// 					id_user: req.body.id_user,
			// 					id_barang: req.body.id_barang,
			// 					jumlah: req.body.jumlah,
			// 					total_harga: req.body.total_harga
			// 				}).then(ref =>{
			// 					dataTransaksi.push({
			// 						id_transaksi: ref.id
			// 					})
			// 					docRefPenjual.doc(dataPenjualTransaksi).get().then(doc=>{
			// 						if(!doc.exists){
			// 							console.log("Data Not Found")
			// 							res.status(400).json({
			// 								status : "data not found"
			// 							})
			// 						}else{
			// 							doc.data().transaksi.map(e=>{
			// 								dataTransaksi.push(e)
			// 							})
			// 							docRefPenjual.doc(dataPenjualTransaksi).update({
			// 								"transaksi": 
			// 									dataTransaksi
			// 							}).then(()=>{
			// 								res.status(200).json({
			// 									message: "success"
			// 								})
											
			// 							}).catch(err=>{
			// 								console.log("Error", err)
			// 							});
			// 						}
			// 					});
			// 				});
			// 			}
			// 		});
			// 	});
			// });


  