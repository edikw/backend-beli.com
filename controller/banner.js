var banner = {
	getAll: function(ref, req, res){
		var banner = [];
		ref.get().then(snapshot => {
			snapshot.forEach( doc => {
				banner.push({
					id: doc.id,
					banner: doc.data()
				});
			});
			res.status(200).send(banner)
		}).catch(err =>{
			console.log('error', err)
		});
	}
}

export default banner;