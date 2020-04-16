const express = require('express');
const app = express();
var bodyParser = require('body-parser');
const crypto =  require('crypto');
const multer = require('multer');
const path = require('path');
var jwt = require('jsonwebtoken');
var cors = require('cors');
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }))
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
var searchController = require('./controller/search.js');
var transaksiController = require('./controller/transaksi.js');
var decrypts  = require ('./controller/passwords.js');

// =============================================

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + file.originalname)
  }
})

var upload = multer({
	storage: storage
}).single('image');

// ================================================

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
	async function registerUser() {
		try {

			await getRefUserEmail.get().then(snapshot => {
				snapshot.forEach(doc => {
					emailExist = doc.data()
				});
			});
			if (emailExist) {
				res.status(400).json({
					status: 'Failed',
					message: 'email exist'
				});
			}else {
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

	var getRefUserPasword = docRefUser.where('password', '==', decrypts.decrypt(req.body.password))
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
			if(password == decrypts.decrypt(req.body.password) && email == req.body.email){
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
	var dataChart = [];
	var id_barang = [];
	var checkRes = false;

	function getUser(){
		docRefUser.doc(req.params.id).get().then(doc => {
			dataChart = doc.data().chart

			if(doc.data().chart.length > 0){
				if(checking(doc.data().chart) == true){
					res.status(400).json({
						message: 'barang ada'
					})
				}else {
					addChart();
				}
			}else{
				addChart();
			}
		})
	}
	getUser();

		function addChart(){
				dataChart.push({
					id_barang: req.body.id_barang
				});
				updateChart();
		}

		function updateChart(){
			docRefUser.doc(req.params.id).update({
				"chart": dataChart
			})
			res.status(200).json({
				message: 'success'
			})
			
		}

		function checking (barang) {
			var check;
			for (var i = 0; i < barang.length; i++) {
				if(barang[i].id_barang == req.body.id_barang){
					return check = true
				}else {
					check = false
				}
			}
		}

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

app.put('/chart/user/:id', (req, res, next)=> {
	var dataBarang = []
	docRefUser.doc(req.params.id).get().then(doc =>{
		if(!doc.exists){
			console.log("Data Not Found")
			res.status(400).json({
				status : "data not found"
			})
		}else{
			dataBarang = doc.data().chart
			deleteBarang(dataBarang, function(data){
				if(data.checkBarang == true){
					updateCart(data.result)
				}else {
					res.status(400).json({
						message: data.result
					})
				}
			})
			
		}

	});
	function deleteBarang(barang, callback){
		var checkBarang;
		var result = []
		for (var i = 0; i < barang.length; i++) {
			if(barang[i].id_barang == req.body.id_barang){
				barang.splice(i, 1)
				result = barang
				checkBarang = true;
			}else{
				checkBarang = false;
			}
		}
		if(result.length > 0){
			callback({
				checkBarang : true,
				result: result})
		}else {
			callback({
				checkBarang: false,
				result : "Barang Tidak ada"
			})
		}
	}

	function updateCart(resultBarang){
		docRefUser.doc(req.params.id).update({
			"chart": resultBarang
		}).then(doc =>{
			res.status(200).json({
				message: 'success'
			})
			console.log("berhasil", resultBarang)
		}).catch(err =>{
			res.status(400).json({
				message: 'failed'
			})
		})
	}
});

app.get('/banner', (req,res,next)=> {
	bannerController.getAll(docRefBanner, req, res);
});

app.post('/user/transaksi/:id', (req, res)=>{

	var dataTransaksi = [];
	docRefUser.doc(req.params.id).get().then(doc =>{
		console.log('1', doc)
		if(!doc.exists){
			console.log("Data Not Found")
			res.status(400).json({
				status : "data not found"
			})
		}else{
			if(doc.data().transaksi.length > 0){
				console.log('2', doc)
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
				nama_penerima: req.body.nama_penerima,
				upload_bukti: null
			}).then(ref => {
				dataTransaksi.push({
					id_transaksi: ref.id,
					id_barang: req.body.id_barang
				});
				updateUserTransaksi(ref.id);
			}).catch(err => {
				res.status(400).json({
					message: 'Failed'
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
	transaksiController.getId(docRefTransaksi ,req, res);
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

app.post('/search', (req, res, next)=> {
	searchController.search(docRefBarang, req,res);
});

app.put('/profile/users/:id', (req, res)=>{
	userController.UpdateProfileUser(docRefUser, req, res);
});


// BELUM SELESAI
app.post('/transfers', (req, res) =>{
	upload(req, res,(err) => {
		
		var host = req.host;
		var filePath = req.protocol + "://" + host + '/' + req.file.filename;
		
		res.status(200).json({
			message: 'success',
			result: filePath
		})
		console.log(req.file)
	})
});