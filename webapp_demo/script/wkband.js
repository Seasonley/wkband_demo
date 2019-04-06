WKBand={
	uuid:'K18S_0b5750cc8a',
	utils:[
		{	SID:'00001800-0000-1000-8000-00805f9b34fb',
			plist:[	{TID:'00002a00-0000-1000-8000-00805f9b34fb',DESC:'read write'},
					{TID:'00002a01-0000-1000-8000-00805f9b34fb',DESC:'read'}]},
		{	SID:'0000fff0-0000-1000-8000-00805f9b34fb',
			plist:[	{TID:'0000fff1-0000-1000-8000-00805f9b34fb',DESC:'notify'},
					{TID:'0000fff2-0000-1000-8000-00805f9b34fb',DESC:'write no response'}]},
		{	SID:'0000180d-0000-1000-8000-00805f9b34fb',
			plist:[	{TID:'00002a37-0000-1000-8000-00805f9b34fb',DESC:'notify'},
					{TID:'00002a38-0000-1000-8000-00805f9b34fb',DESC:'notify'},
					{TID:'00002a39-0000-1000-8000-00805f9b34fb',DESC:'write'}]}
	],
	error_code:[
		'校验错误',//0x01
		'内容错误，内容的值不合理',//0x02
		'无此项数据（没有此项功能码）'//0x03
	],
	remind_list:[
		'防丢提醒',
		'短信提醒',
		'来电提醒',
		'蓝牙自动关广播',
		'抬手亮屏',
		'翻腕切屏',
		'微信提醒',
		'QQ提醒',
		'facebook',
		'skype',
		'twitter',
		'whatsAPP'
	],
	packageCreate:function(method,data){
		//数据长度 0x0000 - 0xFFFF
		var data_len='000'+(data.length/2).toString(16);
		data_len=data_len.slice(data_len.length-4);

		var package=[	'68',
				method,
				data_len.slice(2),
				data_len.slice(0,2),
				data];
		//将整个数据包的每个字节相加（不包括 检验码 和 尾帧），
		//取这个数的最低位字节即可（即对256取余）作为检验码
		var package_str=package.join('');
		var check=0;
		for(var i=0;i<package_str.length;i=i+2){
			check+=parseInt(package_str.slice(i,i+2),16);
		}
		package.push((check%256).toString(16));
		package.push('16');
		return package.join('').toUpperCase();
	}
}
WKBand.tel={
/* 拨打电话
停止提醒 WKBand.tel.closeQ();
开始提醒 WKBand.tel.startQ('13656898745','张三');
*/
	fcode:'01',
	startQ:function(pNumber,pName){
		pNumber=pNumber.split('');// 转ascii15位
		for(var i=0;i<15;i++){
			pNumber[i]=(pNumber.length<i+1)?'00':pNumber[i].charCodeAt().toString(16);
		}
		pNumber=pNumber.join('');
		pName=encodeURI(pName.slice(0,8)).split('%').join('');// 转utf8编码
		return WKBand.packageCreate(this.fcode,'00'+pNumber+pName);

	},
	closeQ:function(){
		return WKBand.packageCreate(this.fcode,'01');
	}
}
WKBand.base={
/*
0x00	12/24小时制	1byte	0x00:12小时制    0x01:24小时制
0x01	公制/英制	1byte	0x00:公制    0x01:英制
0x02	心率监控间隔	1byte	单位分钟：最小值5分钟，最大值60分钟
0x03	疲劳度监控开关	1byte	0x00：关闭    0x01：开启
0x04	心率自动监控开关	1byte	0x00：关闭    0x01：开启
请求获取参数 WKBand.base.getQ()
应答获取参数 WKBand.base.getA(str)
请求设置参数 WKBand.base.setQ({
		hourly24:true,
		metric:true,
		interval:5,
		fatigue:false,
		pluse:false})
应答设置参数  WKBand.base.setA(str)
*/
	fcode:'02',
	getQ:function(){
		return WKBand.packageCreate(this.fcode,'0600000001020304');
	},
	getA:function(str){
		return {
			hourly24:str.slice(12,14)=='01',
			metric:str.slice(14,16)=='00',
			interval:parseInt(str.slice(16,18),16),
			fatigue:str.slice(18,20)=='01',
			pluse:str.slice(20,22)=='01'
		}
	},
	setQ:function(obj){
		var data=[
			obj.hourly24?'01':'00',
			obj.metric?'00':'01',
			('0'+obj.interval.toString(16).toUpperCase()).slice(-2),
			obj.fatigue?'01':'00',
			obj.pluse?'01':'00'
		];
		var str='';
		for(var i=0;i<data.length;i++){
			str+='0'+i+data[i];
		}
		return WKBand.packageCreate(this.fcode,'01'+str);
	},
	setA:function(str){
		return (str.slice(12,14)+str.slice(14,16)+str.slice(16,18)+str.slice(18,20)+str.slice(20,22))=='0000000000';
	}
}
WKBand.battery={
/*
请求获取电量 WKBand.battery.getQ()
应答获取电量 WKBand.battery.getA('688301005E4A16')
*/
	fcode:'03',
	getQ:function(){
		return WKBand.packageCreate(this.fcode,'');
	},
	getA:function(str){
		return parseInt(str.slice(8,10),16);
	}
}
WKBand.walk={
/*
设置计步参数
WKBand.walk.setQ({height:172,weight:67,female:false,age:23})
*/
	fcode:'04',
	setQ:function(obj){
		str=obj.height.toString(16);
		str+=obj.weight.toString(16);
		str+=obj.female?'01':'00'
		str+=('0'+obj.age.toString(16)).slice(-2);
		return WKBand.packageCreate(this.fcode,str);
	}
}
WKBand.remind={
/*
0x01：防丢提醒
0x02：短信提醒
0x03：来电提醒
0x05：蓝牙自动关广播
0x06：抬手亮屏
0x07：翻腕切屏
0x09：微信提醒
0x0a：QQ提醒
0x0b：facebook
0x0c：skype
0x0d：twitter
0x0e：whatsAPP

WKBand.remind.getQ('01')
*/
	fcode:'05',
	getQ:function(index){
		return WKBand.packageCreate(this.fcode,'01'+index);
	},
	getA:function(str){
		return str.slice(12,14)=='01'
	},
	setQ:function(index,bool){
		return WKBand.packageCreate(this.fcode,'00'+index+(bool?'01':'00'));
	}
}
WKBand.sensor={
/*
心率		1	心率数据(最大值220，超过则用220显示)
当前步数	4	单位步（低字节先传）
当前里程	4	单位米（低字节先传）
当前消耗热量	4	单位大卡（KCal）（低字节先传）
当前步速	1	单位   步/s（最大50步/秒）

WKBand.sensor.getA('68860e0046000000000000000001000000004316')

*/
	fcode:'06',
	getQ:function(){
		return WKBand.packageCreate(this.fcode,'00');
	},
	getA:function(str){
		return {pluse:parseInt(str.slice(8,10),16),
			walk:parseInt(str.slice(16,18)+str.slice(14,16)+str.slice(12,14)+str.slice(10,12),16),
			km:parseInt(str.slice(24,26)+str.slice(22,24)+str.slice(20,22)+str.slice(18,20),16),
			kcal:parseInt(str.slice(32,34)+str.slice(30,32)+str.slice(28,30)+str.slice(26,28),16),
			speed:parseInt(str.slice(34,36),16)
		};
	},
	startQ:function(){
		return WKBand.packageCreate(this.fcode,'01');
	},
	startA:function(str){
		return str.slice(8,10)=='01'
	},
	closeQ:function(){
		return WKBand.packageCreate(this.fcode,'02');
	},
	closeA:function(str){
		return str.slice(8,10)=='02'
	}
}
WKBand.alert={
/*
闹钟数据obj
{
	type:3,
	time:[{h:12,m:0},{h:13,m:30}],
	week:[1,1,1,1,1,1,1],
	desc:'喝水'
}

获取闹钟
WKBand.alert.getQ(7)
WKBand.alert.getA(str)

设置闹钟
WKBand.alert.setQ(7,obj)
WKBand.alert.setA(str)

删除闹钟
WKBand.alert.delQ(7)
WKBand.alert.delA(str)

*/
	fcode:'09',
	getQ:function(int0_7){
		return WKBand.packageCreate(this.fcode,'000'+int0_7);
	},
	getA:function(str){
		var obj={type:6,time:[],week:[],desc:'未命名提醒'};
		str=str.slice(12,str.length-4);
		switch(obj.type=parseInt(str.slice(0,2))){
			case 1: obj.desc='运动'; break;
			case 2: obj.desc='约会'; break;
			case 3: obj.desc='喝水'; break;
			case 4: obj.desc='吃药'; break;
			case 5: obj.desc='睡觉'; break;
			default:
				var tmp=str.slice(2*sum+2*3);
				obj.desc='';
				for(var i=0;i<tmp.length;i++){
					str_unicode=str.slice(i*4,4+i*4);
					obj.desc+=String.fromCharCode(str_unicode,16).toString(10);
				}
		}
		var sum=parseInt(str.slice(2,4));
		for(var i=0;i<sum;i++){
			var h=str.slice(4+i*4,6+i*4);
			var m=str.slice(6+i*4,8+i*4);
			obj.time.push({h:parseInt(h,16),m:parseInt(m,16)-1});
		}
		var week=str.slice(4+i*4,6+i*4);
		week='0000000'+parseInt(week,16).toString(2);
		obj.week=week.slice(-7).split('');
		return obj;
	},
	setQ:function(int0_7,obj){
		var str='0'+obj.type+'0'+obj.time.length;
		for(var i=0;i<obj.time.length;i++){
			var h='0'+obj.time[i].h.toString(16);
			var m='0'+(obj.time[i].m+1).toString(16);
			str+=h.slice(-2)+m.slice(-2)
		}
		var week='0'+parseInt(obj.week.join(''),2).toString(16);
		str+=week.slice(-2);
		var desc='';
		if(obj.type==6){
			desc=encodeURI(obj.desc.slice(0,22)).split('%').join('');
		}
		return WKBand.packageCreate(this.fcode,'010'+int0_7+str+desc);
	},
	setA:function(str){
		return str.length==12;
	},
	delQ:function(int0_7){
		return WKBand.packageCreate(this.fcode,'020'+int0_7);
	},
	delA:function(str){
		return str.length==12;
	}
}
WKBand.tired={
/*
疲劳度测试

*/
	fcode:'0A',
	startQ:function(){
		return WKBand.packageCreate(this.fcode,'01');
	},
	startA:function(str){
		return str.length==12;
	},
	closeQ:function(){
		return WKBand.packageCreate(this.fcode,'00');
	},
	closeA:function(str){
		return str.length==12;
	}
}
WKBand.message={
/*
短消息提醒
obj{
	type:'wx',
	name:'',
	text:''
}
WKBand.message.setQ(obj)
WKBand.message.setA(str)


*/
	fcode:'0B',
	setQ:function(obj){
		var type=0;
		switch(obj.type){
			case 'msg'		: type=0; break;
			case 'wechat'	: type=1; break;
			case 'qq'		: type=2; break;
			case 'facebook'	: type=3; break;
			case 'skype'	: type=4; break;
			case 'twitter'	: type=5; break;
			case 'whatsapp'	: type=6; break;
		}
		var msg_utf8=encodeURI(('['+obj.name+']'+obj.text).slice(0,8)).split('%').join('');// 转utf8编码
		return WKBand.packageCreate(this.fcode,'0'+type+msg_utf8);
	},
	setA:function(str){
		return str.length==14;
	}
}
WKBand.photo={
/*
拍照启动
WKBand.photo.startQ()
WKBand.photo.startA(str)
拍照关闭
WKBand.photo.closeQ()
WKBand.photo.closeA(str)
手环拍照
WKBand.photo.postQ()
WKBand.photo.postA(str)
*/
	fcode:'0D',
	startQ:function(){
		return WKBand.packageCreate(this.fcode,'00');
	},
	startA:function(str){
		return str.length==14;
	},
	closeQ:function(){
		return WKBand.packageCreate(this.fcode,'01');
	},
	startA:function(str){
		return str.length==14;
	},
	postQ:function(){
		return WKBand.packageCreate('0E','');
	},
	postA:function(str){
		return str.length==12;
	}

}
WKBand.pluseWarning={
/*
心率预警功能
obj{is_on:true,pluse_max:120,pluse_min:50}
读取
WKBand.pluseWarning.getQ()
WKBand.pluseWarning.getA(str)
设置
WKBand.pluseWarning.setQ()
WKBand.pluseWarning.setA(str)
*/
	fcode:'10',
	getQ:function(){
		return WKBand.packageCreate(this.fcode,'02');
	},
	getA:function(str){
		return{
			is_on:str.slice(10,12)=='00',
			pluse_min:parseInt(str.slice(12,14),16),
			pluse_max:parseInt(str.slice(14,16),16)
		};
	},
	setQ:function(obj){
		return WKBand.packageCreate(this.fcode,'01'+(obj.is_on==true)?'00':'01'+ob.pluse_max.toString(16)+ob.pluse_min.toString(16));
	},
	setA:function(str){
		return str.length==14;
	}
}
WKBand.reset={
/*
恢复出厂设置
读取
WKBand.reset.setQ()
WKBand.reset.setA(str)
*/
	fcode:'11',
	setQ:function(){
		return WKBand.packageCreate(this.fcode,'01');
	},
	setA:function(){
		return str.slice(10,12)=='00';
	}
}
WKBand.tellater={
/*
电话提醒延时功能
读取
WKBand.tellater.getQ()
WKBand.tellater.getA(str)
设置
WKBand.tellater.setQ(second)
WKBand.tellater.setA(str)
*/
	fcode:'12',
	getQ:function(){
		return WKBand.packageCreate(this.fcode,'02');
	},
	getA:function(str){
		return parseInt(str.slice(10,12),16);
	},
	setQ:function(second0_15){
		return WKBand.packageCreate(this.fcode,'010'+second0_15.toString(16));
	},
	setA:function(str){
		return str.length==14;
	}
}
WKBand.find={
/*
找手环功能
开始
WKBand.find.startQ()
WKBand.find.startA(str)
结束
WKBand.find.closeQ()
WKBand.find.closeA(str)
*/
	fcode:'13',
	startQ:function(){
		return WKBand.packageCreate(this.fcode,'00');
	},
	startA:function(str){
		return str.length==14;
	},
	closeQ:function(){
		return WKBand.packageCreate(this.fcode,'01');
	},
	closeA:function(str){
		return str.length==14;
	}
}
WKBand.needStand={
/*
久坐提醒功能
读取
WKBand.needStand.getQ()
WKBand.needStand.getA(str)
设置
WKBand.needStand.setQ()
WKBand.needStand.setA(str)
删除
WKBand.needStand.delQ()
WKBand.needStand.delA(str)
*/
	fcode:'14',
	getQ:function(){
		return WKBand.packageCreate(this.fcode,'ff');
	},
	getA:function(str){
		var sum =parseInt(str.slice(4,6),16);
		sum=(sum-1)/7;
		var list=[];
		if(sum==0)return list;
		for(var i=0;i<sum;i++){
			var obj={}
			obj.index=parseInt(str.slice(10+i*14,12+i*14),16);
			obj.start_hh=parseInt(str.slice(14+i*14,16+i*14),16);
			obj.start_mm=parseInt(str.slice(16+i*14,18+i*14),16);
			obj.close_hh=parseInt(str.slice(18+i*14,20+i*14),16);
			obj.close_mm=parseInt(str.slice(20+i*14,22+i*14),16);
			obj.maxtime=parseInt(str.slice(22+i*14,24+i*14),16);
			list.push(obj);
		}
		return list;
	},

	setQ:function(){

	},
	setA:function(str){

	},

	delQ:function(){

	},
	delA:function(str){

	}

}

WKBand.clock={
/*
校时
WKBand.clock.setQ(unix_time,area)
WKBand.clock.setA(str)
*/
	fcode:'20',
	setQ:function(unix_time,area){
		if(!area)area=8;
		if(!unix_time){unix_time=Date.parse(new Date())/1000+area*3600}
		unix_time=unix_time.toString(16);
		unix_time=unix_time.slice(6,8)+unix_time.slice(4,6)+unix_time.slice(2,4)+unix_time.slice(0,2)
		return WKBand.packageCreate(this.fcode,unix_time);
	},
	setA:function(str){
		return str.length==14;
	}
}
WKBand.uploadSensor={
/*
上传监测数据
WKBand.uploadSensor.getQ(str)
WKBand.uploadSensor.getA(str)
*/
	fcode:'21',
	getQ:function(str){
		var data={
			d:str.slice(8,10),
			m:str.slice(10,12),
			y:str.slice(12,14),
			walk:str.slice(20,22)+str.slice(18,20)+str.slice(16,18)+str.slice(14,16),
			miles:str.slice(28,30)+str.slice(26,28)+str.slice(24,26)+str.slice(22,24),
			kcal:str.slice(36,38)+str.slice(34,36)+str.slice(32,34)+str.slice(30,32),
			runtime:str.slice(44,46)+str.slice(42,44)+str.slice(40,42)+str.slice(38,40)
		};
		for(var p in data){
		   data[p]=parseInt(data[p],16);
		}
		return data;
	},
	getA:function(str){
		return WKBand.packageCreate(this.fcode,str.slice(8,14));
	}
}
