import { encrypt, decrypt } from './passwords.js';

var index = {
	getById: function(ref, req, res){
		ref.doc(req.params.id).get().then(doc =>{
			if(!doc.exists){
				res.status(400).json({
					status : "data not found"
				})
			}else {
				res.status(200).json({
					result: doc.data(),
					password: encrypt(doc.data().password)
				})
			}
		}).catch(err=>{
			console.log("Error", err)
		})		
	},
	postUser: function(ref, req,res){
		let password = decrypt(req.body.password)
		ref.add({
				username: req.body.username,
				fullname: null,
				password: password,
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
	    	res.status(200).json({
	    		message: 'Berhasil register'
	    	});
		})
		.catch((err) => {
		    console.log('Error adding user', err);
		});
	},
	UpdateProfileUser: function(ref, req, res){
		var dataUser = []

		ref.get().then(snapshot => {
			snapshot.forEach(doc => {
				if(doc.id != req.params.id){
					dataUser.push(doc.data().email)
				}
			})
			if(compaireEmail() == true){
				updateUser()
			}else {
				res.status(400).json({
					message: 'email sudah ada'
				})
			}
		})

		function compaireEmail(){
			var checkEmail = false
			for (var i = 0; i < dataUser.length; i++) {
				if(dataUser[i] != req.body.email){
					return checkEmail = true
				}
			}
		}

		function updateUser(){
			
			ref.doc(req.params.id).update({
				fullname : req.body.fullname,
				username : req.body.username,
				email : req.body.email,
				password : decrypt(req.body.password),
				alamat: req.body.alamat,
				birthday: req.body.birthday

			}).then(()=>{
				res.status(200).json({
					message: "success"
				})
			}).catch(err=>{
				console.log("Error", err)
			})
		}
	}
}

export default index;