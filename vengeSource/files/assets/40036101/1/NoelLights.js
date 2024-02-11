var NoelLights = pc.createScript('noelLights');

NoelLights.attributes.add('lightEntity', { type : 'entity' });
NoelLights.prototype.initialize = function() {
    this.currentLight = false;
    this.currentLightIndex = 0;
    
    this.lastLight = Date.now();
};

NoelLights.prototype.selectRandomLight = function(dt) {
    var lights = this.entity.findByTag('Light');
    
    for(var lightIndex in lights){
        var light = lights[lightIndex];
        
        if(Math.random() > 0.3){
            light.enabled = true;
        }else{
            light.enabled = false;
        }
    }
    
    this.lightEntity.light.intensity = 3 + Math.random() * 5;
};

NoelLights.prototype.update = function(dt) {
    if(Date.now() - this.lastLight > 400){
        this.selectRandomLight();
        this.lastLight = Date.now();
    }
    
    var lights = this.entity.findByTag('Light');
    
    for(var lightIndex in lights){
        var light = lights[lightIndex];
        
        light.rotateLocal(0, 0.2, 0);
    }
};