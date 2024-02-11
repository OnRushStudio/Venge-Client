var PositionalSound = pc.createScript('positionalSound');

PositionalSound.attributes.add('distance', { type : 'number', default : 5 });
PositionalSound.attributes.add('count', { type : 'number', default : 2 });

PositionalSound.prototype.initialize = function() {
    this.lens = this.app.root.findByName('Lens');
    
    this.entity.on('PositionalSound:' + this.entity.name, this.onTrigger, this);
    this.on('destroy', this.onDestroy, this);
};

PositionalSound.prototype.onDestroy = function() {
    this.entity.off('PositionalSound:' + this.entity.name, this.onTrigger, this);
};

PositionalSound.prototype.onTrigger = function() {
    var distance = this.lens.getPosition().clone()
    .sub(this.entity.getPosition()).length();
    
    if(distance > this.distance){
        this.entity.sound.play('Far-Distance');
    }else{
        var randomNumber = Math.floor(Math.random() * this.count) + 1;
        
        console.log('Sound-' + randomNumber);
        
        this.entity.sound.play('Sound-' + randomNumber);
    }
};