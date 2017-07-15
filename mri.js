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
	
    init: function init(params) {
        var me=MRI;
        
        // check params
        if(!params.mriPath) {
            console.error("No mri path");
            return;
        }
        
        // set params
        me.mriPath=params.mriPath;
        
        var def=me.loadMRI();
        
        return def;
    },
    loadMRI: function loadMRI() {
        var me=MRI;
        var def=$.Deferred();

        // init data
		var oReq = new XMLHttpRequest();
		oReq.open('GET', me.mriPath, true);
		oReq.responseType='arraybuffer';
		oReq.onload = function(oEvent) {
			// decompress data
			var niigz=this.response;
            var inflate=new pako.Inflate();
            inflate.push(new Uint8Array(niigz),true);
            var nii=inflate.result.buffer;
            me.mri=me.parseNifti(nii);
            def.resolve();
        }
		oReq.send();
		
		return def.promise();
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
	}
}