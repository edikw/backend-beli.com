var index = {
	getId: function (ref, req, res){
		ref.doc(req.params.id).get().then(doc=>{
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
	}
}

export default index;