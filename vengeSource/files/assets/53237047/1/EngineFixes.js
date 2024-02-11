pc.SpriteAnimationClip.prototype._onSpriteAssetLoad = function(asset){
    if(!asset){
        return false;
    }

    if (!asset.resource) {
        this.sprite = null;
    } else {
        if (!asset.resource.atlas) {
            var atlasAssetId = asset.data.textureAtlasAsset;
            var assets = this._component.system.app.assets;
            assets.off('load:' + atlasAssetId, this._onTextureAtlasLoad, this);
            assets.once('load:' + atlasAssetId, this._onTextureAtlasLoad, this);
        } else {
            this.sprite = asset.resource;
        }
    }
};