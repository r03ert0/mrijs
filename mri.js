'use strict';

/*
    Initialisation:
    - init
        calls loadMRI (which returns a promise)
            calls parseNifti
*/
var MRI = {
    mriPath: null,          // path to mri
    mri: null,              // mri data
    loadMRIFromPath: function loadMRIFromPath(path) {
        var me=MRI;
        var pr = new Promise(function(resolve, reject) {  
            // load data
            var req = new XMLHttpRequest();
            req.open('GET', path, true);
            req.responseType='arraybuffer';
            req.onload = function(oEvent) {
                // decompress data
                var niigz=this.response;
                var inflate=new pako.Inflate();
                inflate.push(new Uint8Array(niigz),true);
                var nii=inflate.result.buffer;
                me.mri=me.parseNifti(nii);
                me.computeS2VTransform();
                resolve();
            };
            req.onerror = function () {
              reject("Error loading data");
            };
            req.send();
        });
        return pr;
    },
    loadMRIFromFile: function loadMRIFromFile(file) {
        var me=MRI;
        var pr = new Promise(function(resolve, reject) {  
            // load data
            var reader = new FileReader();
            reader.onload = function() {
                // decompress data
                var niigz=this.result;
                var inflate=new pako.Inflate();
                inflate.push(new Uint8Array(niigz),true);
                var nii=inflate.result.buffer;
                me.mri=me.parseNifti(nii);
                me.computeS2VTransform();
                console.log('done');
                resolve();
            };
            reader.readAsArrayBuffer(file);
/*
            var req = new XMLHttpRequest();
            req.open('GET', me.mriPath, true);
            req.responseType='arraybuffer';
            req.onload = function(oEvent) {
                // decompress data
                var niigz=this.response;
                var inflate=new pako.Inflate();
                inflate.push(new Uint8Array(niigz),true);
                var nii=inflate.result.buffer;
                me.mri=me.parseNifti(nii);
                me.computeS2VTransform();
                resolve();
            };
            req.onerror = function () {
              reject("Error loading data");
            };
            req.send();
*/
        });
        return pr;
    },
    NiiHdrLE: Struct()
        .word32Sle('sizeof_hdr')        // Size of the header. Must be 348 (bytes)
        .chars('data_type',10)          // Not used; compatibility with analyze.
        .chars('db_name',18)            // Not used; compatibility with analyze.
        .word32Sle('extents')           // Not used; compatibility with analyze.
        .word16Sle('session_error')     // Not used; compatibility with analyze.
        .word8('regular')               // Not used; compatibility with analyze.
        .word8('dim_info')              // Encoding directions (phase, frequency, slice).
        .array('dim',8,'word16Sle')     // Data array dimensions.
        .floatle('intent_p1')           // 1st intent parameter.
        .floatle('intent_p2')           // 2nd intent parameter.
        .floatle('intent_p3')           // 3rd intent parameter.
        .word16Sle('intent_code')       // nifti intent.
        .word16Sle('datatype')	        // Data type.
        .word16Sle('bitpix')	        // Number of bits per voxel.
        .word16Sle('slice_start')	    // First slice index.
        .array('pixdim',8,'floatle')    // Grid spacings (unit per dimension).
        .floatle('vox_offset')	        // Offset into a .nii file.
        .floatle('scl_slope')	        // Data scaling, slope.
        .floatle('scl_inter')	        // Data scaling, offset.
        .word16Sle('slice_end')	        // Last slice index.
        .word8('slice_code')	        // Slice timing order.
        .word8('xyzt_units')	        // Units of pixdim[1..4].
        .floatle('cal_max')	            // Maximum display intensity.
        .floatle('cal_min')	            // Minimum display intensity.
        .floatle('slice_duration')	    // Time for one slice.
        .floatle('toffset')	            // Time axis shift.
        .word32Sle('glmax')	            // Not used; compatibility with analyze.
        .word32Sle('glmin')	            // Not used; compatibility with analyze.
        .chars('descrip',80)	        // Any text.
        .chars('aux_file',24)	        // Auxiliary filename.
        .word16Sle('qform_code')	    // Use the quaternion fields.
        .word16Sle('sform_code')	    // Use of the affine fields.
        .floatle('quatern_b')	        // Quaternion b parameter.
        .floatle('quatern_c')	        // Quaternion c parameter.
        .floatle('quatern_d')	        // Quaternion d parameter.
        .floatle('qoffset_x')	        // Quaternion x shift.
        .floatle('qoffset_y')	        // Quaternion y shift.
        .floatle('qoffset_z')	        // Quaternion z shift.
        .array('srow_x',4,'floatle')    // 1st row affine transform
        .array('srow_y',4,'floatle')    // 2nd row affine transform.
        .array('srow_z',4,'floatle')    // 3rd row affine transform.
        .chars('intent_name',16)	    // Name or meaning of the data.
        .chars('magic',4),	            // Magic string.
    NiiHdrBE: Struct()
        .word32Sbe('sizeof_hdr')        // Size of the header. Must be 348 (bytes)
        .chars('data_type',10)          // Not used; compatibility with analyze.
        .chars('db_name',18)            // Not used; compatibility with analyze.
        .word32Sbe('extents')           // Not used; compatibility with analyze.
        .word16Sbe('session_error')     // Not used; compatibility with analyze.
        .word8('regular')               // Not used; compatibility with analyze.
        .word8('dim_info')              // Encoding directions (phase, frequency, slice).
        .array('dim',8,'word16Sbe')     // Data array dimensions.
        .floatbe('intent_p1')           // 1st intent parameter.
        .floatbe('intent_p2')           // 2nd intent parameter.
        .floatbe('intent_p3')           // 3rd intent parameter.
        .word16Sbe('intent_code')       // nifti intent.
        .word16Sbe('datatype')	        // Data type.
        .word16Sbe('bitpix')	        // Number of bits per voxel.
        .word16Sbe('slice_start')	    // First slice index.
        .array('pixdim',8,'floatbe')    // Grid spacings (unit per dimension).
        .floatbe('vox_offset')	        // Offset into a .nii file.
        .floatbe('scl_slope')	        // Data scaling, slope.
        .floatbe('scl_inter')	        // Data scaling, offset.
        .word16Sbe('slice_end')	        // Last slice index.
        .word8('slice_code')	        // Slice timing order.
        .word8('xyzt_units')	        // Units of pixdim[1..4].
        .floatbe('cal_max')	            // Maximum display intensity.
        .floatbe('cal_min')	            // Minimum display intensity.
        .floatbe('slice_duration')	    // Time for one slice.
        .floatbe('toffset')	            // Time axis shift.
        .word32Sbe('glmax')	            // Not used; compatibility with analyze.
        .word32Sbe('glmin')	            // Not used; compatibility with analyze.
        .chars('descrip',80)	        // Any text.
        .chars('aux_file',24)	        // Auxiliary filename.
        .word16Sbe('qform_code')	    // Use the quaternion fields.
        .word16Sbe('sform_code')	    // Use of the affine fields.
        .floatbe('quatern_b')	        // Quaternion b parameter.
        .floatbe('quatern_c')	        // Quaternion c parameter.
        .floatbe('quatern_d')	        // Quaternion d parameter.
        .floatbe('qoffset_x')	        // Quaternion x shift.
        .floatbe('qoffset_y')	        // Quaternion y shift.
        .floatbe('qoffset_z')	        // Quaternion z shift.
        .array('srow_x',4,'floatbe')    // 1st row affine transform
        .array('srow_y',4,'floatbe')    // 2nd row affine transform.
        .array('srow_z',4,'floatbe')    // 3rd row affine transform.
        .chars('intent_name',16)	    // Name or meaning of the data.
        .chars('magic',4),	            // Magic string.
	swapInt16: function swapInt16(arr) {
	    var i,dv = new DataView(arr.buffer);
	    for(i=0;i<arr.length;i++) {
	        arr[i]= dv.getInt16(2*i,false);
	    }
	    return arr;
	},
	swapUint16: function swapUint16(arr) {
	    var i,dv = new DataView(arr.buffer);
	    for(i=0;i<arr.length;i++) {
	        arr[i]= dv.getUint16(2*i,false);
	    }
	    return arr;
	},
	swapInt32: function swapInt32(arr) {
	    var i,dv = new DataView(arr.buffer);
	    for(i=0;i<arr.length;i++) {
	        arr[i]= dv.getInt32(4*i,false);
	    }
	    return arr;
	},
	swapFloat32: function swapFloat32(arr) {
	    var i,dv = new DataView(arr.buffer);
	    for(i=0;i<arr.length;i++) {
	        arr[i]= dv.getFloat32(4*i,false);
	    }
	    return arr;
	},
    /**
     * @function parseNifti
     */
	parseNifti: function parseNifti(nii) {
		var me=MRI;
		var endianness='le';

        me.NiiHdrLE._setBuff(toBuffer(nii));
        var h=JSON.parse(JSON.stringify(me.NiiHdrLE.fields));
        if(h.sizeof_hdr!=348) {
            me.NiiHdrBE._setBuff(toBuffer(nii));
            h=JSON.parse(JSON.stringify(me.NiiHdrBE.fields));   
            endianness='be';     
        }

		var	vox_offset=h.vox_offset;
        var	sizeof_hdr=h.sizeof_hdr;
	
		var mri={};
		mri.hdr=nii.slice(0,vox_offset);
		mri.datatype=h.datatype;
		mri.dim=[h.dim[1],h.dim[2],h.dim[3]];
		mri.pixdim=[h.pixdim[1],h.pixdim[2],h.pixdim[3]];
		
		switch(mri.datatype)
		{
			case 2: // UCHAR
				mri.data=new Uint8Array(nii,vox_offset);
				break;
			case 256: // INT8
				mri.data=new Uint8Array(nii,vox_offset);
				break;
			case 4: // SHORT
			    if(endianness=='le')
                    mri.data=new Int16Array(nii,vox_offset);
                else
                    mri.data=me.swapInt16(new Int16Array(nii,vox_offset));
				break;
			case 8:  // INT
				if(endianness=='le')
                    mri.data=new Int32Array(nii,vox_offset);
                else
                    mri.data=me.swapInt32(new Int32Array(nii,vox_offset));
				break;
			case 16: // FLOAT
			    if(endianness=='le')
    				mri.data=new Float32Array(nii,vox_offset);
    			else
    				mri.data=me.swapFloat32(new Float32Array(nii,vox_offset));
				break;
			case 256: // INT8
				mri.data=new Int8Array(nii,vox_offset);
				break;
			case 512: // UINT16
			    if(endianness=='le')
    				mri.data=new Uint16Array(nii,vox_offset);
    			else
    				mri.data=me.swapUint16(new Uint16Array(nii,vox_offset));
				break;
			default:
				console.error("Unknown dataType: "+mri.datatype);
		}
	
		return mri;
	},
	multMatVec: function multMatVec(m,v) {
	    return [
	        m[0][0]*v[0] + m[0][1]*v[1] + m[0][2]*v[2] + m[0][3],
	        m[1][0]*v[0] + m[1][1]*v[1] + m[1][2]*v[2] + m[1][3],
	        m[2][0]*v[0] + m[2][1]*v[1] + m[2][2]*v[2] + m[2][3],
	    ];
	},
	vox2mm: function vox2mm() {
		var me=MRI;
        var h=JSON.parse(JSON.stringify(me.NiiHdrLE.fields));
	    return [
            [h.srow_x[0], h.srow_x[1], h.srow_x[2], h.srow_x[3]],
            [h.srow_y[0], h.srow_y[1], h.srow_y[2], h.srow_y[3]],
            [h.srow_z[0], h.srow_z[1], h.srow_z[2], h.srow_z[3]],
            [0,0,0,1]
	    ];
	},
	mm2vox: function mm2vox() {
	},
	vox2pix: function vox2pix() {
	},
	pix2vox: function pix2vox() {
	},
	mm2pix: function mm2pix() {
	},
	pix2mm: function pix2mm() {
	},
	
    /**
     * @function computeS2VTransformation
     */
	computeS2VTransform: function computeS2VTransform() {
	/*
		The basic transformation is
		w = v2w * v + wori
		
		Where:
		w: world coordinates. In world coordinates, x=sagittal, y=coronal and z=axial
		wori: origin of the world coordinates
		v: voxel coordinates
		v2w: rotation matrix from v to w
		
		In what follows:
		v refers to native voxel coordinates
		w refers to world coordinates
		s refers screen pixel coordinates
	*/ 
		var me=MRI;

        var h=JSON.parse(JSON.stringify(me.NiiHdrLE.fields));
        var v2w = [
            [h.srow_x[0], h.srow_y[0], h.srow_z[0]],
            [h.srow_x[1], h.srow_y[1], h.srow_z[1]],
            [h.srow_x[2], h.srow_y[2], h.srow_z[2]]
        ];
        var ori = [h.srow_x[3], h.srow_y[3], h.srow_z[3]];
        
        console.log("volume to world",...v2w);
        console.log("origin",ori);

		/*
		var wori=mri.wori;
		var wpixdim=me.subVecVec(me.mulMatVec(v2w,[1,1,1]),me.mulMatVec(v2w,[0,0,0]));
		var wvmax=me.addVecVec(me.mulMatVec(v2w,[mri.dim[0]-1,mri.dim[1]-1,mri.dim[2]-1]),wori);
		var wvmin=me.addVecVec(me.mulMatVec(v2w,[0,0,0]),wori);
		var wmin=[Math.min(wvmin[0],wvmax[0]),Math.min(wvmin[1],wvmax[1]),Math.min(wvmin[2],wvmax[2])];
		var wmax=[Math.max(wvmin[0],wvmax[0]),Math.max(wvmin[1],wvmax[1]),Math.max(wvmin[2],wvmax[2])];
		var w2s=[[1/Math.abs(wpixdim[0]),0,0],[0,1/Math.abs(wpixdim[1]),0],[0,0,1/Math.abs(wpixdim[2])]];
		*/

        var mi={i:0,v:0};v2w[0].map(function(o,n){if(Math.abs(o)>Math.abs(mi.v)) mi={i:n,v:o}});
        var mj={i:0,v:0};v2w[1].map(function(o,n){if(Math.abs(o)>Math.abs(mj.v)) mj={i:n,v:o}});
        var mk={i:0,v:0};v2w[2].map(function(o,n){if(Math.abs(o)>Math.abs(mk.v)) mk={i:n,v:o}});
        
        console.log("maximum axis",mi,mj,mk);
        
		/*
		mri.s2v = {
    		// old s2v fields
			s2w: me.invMat(w2s),
			sdim: [],
			sori: [-wmin[0]/Math.abs(wpixdim[0]),-wmin[1]/Math.abs(wpixdim[1]),-wmin[2]/Math.abs(wpixdim[2])],
			wpixdim: [],
			w2v: me.invMat(v2w),
            wori: wori,

            // new s2v transformation
            x: mi.i, // correspondence between screen coordinate x and voxel coordinate i
            y: mj.i, // same for y
            z: mk.i, // same for z
            dx: (mi.v>0)?1:(-1), // direction of displacement in space coordinate x with displacement in voxel coordinate i
            dy: (mj.v>0)?1:(-1), // same for y
            dz: (mk.v>0)?1:(-1), // same for z
            X: (mi.v>0)?0:(mri.dim[0]-1), // starting value for space coordinate x when voxel coordinate i starts
            Y: (mj.v>0)?0:(mri.dim[1]-1), // same for y
            Z: (mk.v>0)?0:(mri.dim[2]-1) // same for z
		};
        mri.v2w=v2w;
        mri.wori=wori;
        mri.s2v.sdim[mi.i] = mri.dim[0];
        mri.s2v.sdim[mj.i] = mri.dim[1];
        mri.s2v.sdim[mk.i] = mri.dim[2];
        mri.s2v.wpixdim[mi.i] = mri.pixdim[0];
        mri.s2v.wpixdim[mj.i] = mri.pixdim[1];
        mri.s2v.wpixdim[mk.i] = mri.pixdim[2];
        */
	}
}