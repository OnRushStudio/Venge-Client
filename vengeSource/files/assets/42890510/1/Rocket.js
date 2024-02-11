var Rocket = pc.createScript('rocket');

Rocket.attributes.add('isOwner', { type : 'boolean' });
Rocket.prototype.initialize = function() {
    this.entity.collision.on('collisionstart', this.onCollisionStart, this);
    
    setTimeout(function(self){
        self.entity.destroy();
    }, 10000, this);
};

Rocket.prototype.onCollisionStart = function(event) {
    console.log(event, this.isOwner);
    if(event.other && event.other.name == 'Island'){
        event.other.parent.fire('Floating:Damage', event.other.getPosition());
    
        this.app.fire(
            'BakedPhysics:' + event.other.name, 
            event.other.getPosition(),
            event.other.getEulerAngles()
        );

        this.app.fire('SpriteEffect:Destruction', true);
        event.other.destroy();
    }
    
    if(this.isOwner){
        this.app.fire(
            'Network:RadiusEffect', 
            'Rocket', this.entity.getPosition().clone(), pc.controls.player.playerId
        );
    }
    
    this.app.fire('Player:Shake', true);
    this.entity.destroy();
};

Rocket.prototype.update = function(dt) {
    this.entity.translateLocal(0, 0, -1.5);
};