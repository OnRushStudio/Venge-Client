var Shop = pc.createScript('shop');

Shop.attributes.add('shopType', { type : 'string' });
Shop.attributes.add('itemEntity', { type : 'entity' });
Shop.attributes.add('smallItemEntity', { type : 'entity' });
Shop.attributes.add('itemHolder', { type : 'entity' });

Shop.attributes.add('itemPriceEntity', { type : 'entity' });
Shop.attributes.add('itemRarityColor', { type : 'entity' });
Shop.attributes.add('itemRarityText', { type : 'entity' });

Shop.attributes.add('itemTitle', { type : 'entity' });
Shop.attributes.add('itemOwner', { type : 'entity' });
Shop.attributes.add('itemBackground', { type : 'entity' });
Shop.attributes.add('itemUnlockButton', { type : 'entity' });

Shop.attributes.add('raritiesEntity', { type : 'entity' });
Shop.attributes.add('raritiesItem', { type : 'entity' });

Shop.attributes.add('buyPriceEntity', { type : 'entity' });
Shop.attributes.add('creatorCode', { type : 'entity' });
Shop.attributes.add('creatorCodeForm', { type : 'entity' });

Shop.attributes.add('showcaseDisplay', { type : 'entity' });
Shop.attributes.add('unlockButton', { type : 'entity' });
Shop.attributes.add('buyButton', { type : 'entity' });
Shop.attributes.add('equipButton', { type : 'entity' });
Shop.attributes.add('equipText', { type : 'entity' });
Shop.attributes.add('equipedIcon', { type : 'entity' });

Shop.attributes.add('loadingEntity', { type : 'entity' });
Shop.attributes.add('tabTitleEntity', { type : 'entity' });
Shop.attributes.add('previewEntity', { type : 'entity' });
Shop.attributes.add('transactionPriceEntity', { type : 'entity' });

Shop.attributes.add('height', { type : 'number' });
Shop.attributes.add('smallHeight', { type : 'number' });

Shop.attributes.add('greenColor', { type : 'rgb' });
Shop.attributes.add('grayColor', { type : 'rgb' });

Shop.attributes.add('commonColor', { type : 'rgb' });
Shop.attributes.add('xmasColor', { type : 'rgb' });
Shop.attributes.add('uncommonColor', { type : 'rgb' });
Shop.attributes.add('rareColor', { type : 'rgb' });
Shop.attributes.add('legendaryColor', { type : 'rgb' });
Shop.attributes.add('mythicalColor', { type : 'rgb' });

Shop.attributes.add('commonPercentage', { type : 'string' });
Shop.attributes.add('xmasPercentage', { type : 'string' });
Shop.attributes.add('uncommonPercentage', { type : 'string' });
Shop.attributes.add('rarePercentage', { type : 'string' });
Shop.attributes.add('legendaryPercentage', { type : 'string' });
Shop.attributes.add('mythicalPercentage', { type : 'string' });

Shop.prototype.initialize = function() {
    this.items = [];
    this.currentItemIndex = 0;
    this.currentTab = 'Offers';
    this.buyTimeout = false;
    this.lastSelectedSKU = '750VG';
    
    this.rarities = [];
    this.currentItem = {};
    
    this.transactionToken = false;
    this.currentQuantity  = 750;
    this.contentCreatorCode = '';
    
    this.quantities = {
        '0.99 USD' : 1500,
        '1.99 USD' : 1500,
        '5.99 USD' : 5000,
        '9.99 USD' : 10000,
        '20.99 USD' : 25000,
        '34.99 USD' : 50000,
        '59.99 USD' : 100000
    };
    
    this.rarityNumbers = {
        'Special' : {
            common : 0,
            uncommon : 45,
            rare : 35,
            xmas : 10,
            legendary : 5,
            mythical : 5
        },
        'T1 Crate' : {
            common : 55,
            uncommon : 30,
            rare : 15,
            legendary : 0,
            mythical : 0
        },
        'T2 Crate' : {
            common : 50,
            uncommon : 30,
            rare : 15,
            legendary : 5,
            mythical : 0
        },
        'T3 Crate' : {
            uncommon : 60,
            rare : 35,
            legendary : 4.95,
            mythical : 0.05
        }
    };
    
    this.app.on('Shop:TransactionToken', this.onTransactionToken, this);
    this.app.on('Shop:Buy', this.onShopBuy, this);
    this.app.on('Shop:BuyOffer', this.onShopBuyOffer, this);
    this.app.on('Shop:CreatorCode', this.setCreatorCode, this);
    this.app.on('Shop:ApplyCreatorCode', this.applyCreatorCode, this);
    
    this.app.on('Shop:SetItems', this.setShopItems, this);
    this.app.on('Shop:Select', this.onItemSelect, this);
    this.app.on('Shop:Preview', this.setPreview, this);
    this.app.on('Shop:Bought', this.onBuy, this);
    this.app.on('Shop:Equip', this.onEquip, this);
    this.app.on('Shop:Equiped', this.onEquiped, this);
    this.app.on('Shop:Transaction', this.onTransaction, this);
    
    this.app.on('Shop:Watch', this.onWatch, this);
    
    this.app.on('Shop:SetItem', this.setItem, this);
    this.app.on('Shop:BuyState', this.setBuyOfferState, this);
    
    //mobile payment
    this.app.on('Buy:State', this.onMobileBuyState, this);
    
    this.app.on('Shop:Unlock', this.onItemUnlock, this);
    this.app.on('Tab:Shop:Changed', this.onTabChange, this);
    
    /*
    this.itemEntity.enabled = false;
    this.smallItemEntity.enabled = false;
    this.previewEntity.enabled = true;
    
    this.on('state', this.onStateChange, this);
    */
};

Shop.prototype.onWatch = function(){
    var offer = this.currentItem;
    
    this.app.fire('Ads:Preroll', function(){
        //success
        pc.app.fire('Fetcher:BuyOffer', { offer_id : offer.id });
        
        setTimeout(function(){
            pc.app.fire('Fetcher:Crates');
        pc.app.fire('Index:Tabs', 1);
        }, 100);
    }, function(){
        pc.app.fire('Alert:Menu', 'Disable adblocker to buy this offer.');
    });
};

Shop.prototype.applyCreatorCode = function(){
    this.app.fire('Fetcher:CreatorCode', {
        creator_code : document.getElementById('creator-code-input').value
    });  
};

Shop.prototype.setBuyOfferState = function(data){
    if(data.success){
        this.app.fire('Shop:Bought', data);
    }else{
        if(data.buy_coin === true){
            this.app.fire('Notify:Notify', 'You don\'t have enough coins');
            
            setTimeout(function(self){
                self.app.fire('Popup:Coins');
            }, 1000, this);
        }else{
            this.app.fire('Alert:Menu', data.message);
        }
    }
};

Shop.prototype.setItem = function(item){
    this.currentItem = item;
};

Shop.prototype.onMobileBuyState = function(state){
    if(state == 'error'){
        this.app.fire('Alert:Menu', 'An error occured on payment!');
    }else if(state == 'successful'){
        this.app.fire('Fetcher:MobilePayment', { 
            token : 'mobile-process',
            sku   : this.lastSelectedSKU
        });
    }else if(state == 'restored'){
        //restore current payments
        this.app.fire('Fetcher:MobilePayment', { 
            token : 'mobile-process',
            sku   : this.lastSelectedSKU
        });
    }
};

Shop.prototype.setCreatorCode = function(result){
    /*
    this.contentCreatorCode = result.code;
    
    this.creatorCode.enabled = true;
    this.creatorCode.element.text = 'Code : ' + result.creator;
    this.creatorCodeForm.enabled = false;
    */
    
    this.contentCreatorCode = result.code;
    
    var element = document.getElementById('creator-code');
    
    if(element){
        document.getElementById('creator-code').innerHTML = 
            'Code applied : ' + result.code;   
    }
};

Shop.prototype.onShopBuy = function(item){
    this.currentQuantity = this.quantities[item];

    this.app.fire('Fetcher:TransactionToken', { 
        quantity : this.currentQuantity,
        content_creator : this.contentCreatorCode
    });
};

Shop.prototype.onShopBuyOffer = function(quantity){
    this.transactionToken  = false;
    //this.buyButton.enabled = false;

    this.app.fire('Fetcher:TransactionToken', { 
        quantity : quantity,
        content_creator : this.contentCreatorCode
    });
    
    setTimeout(function(){
        pc.app.fire('Show:Menu', 'HideLoading');
    }, 5000, this);
};

Shop.prototype.onTransactionToken = function(result){
    if(result && result.success === true){
        
    }else{
        return false;
    }
    
    if(result.token == 'mobile_3ce5'){
        this.lastSelectedSKU = result.sku;
        window.webkit.messageHandlers.iosListener.postMessage('buy:' + result.sku);
        
        //trigger mobile buy function
        return false;
    }
    
    //console.log('Transaction token : ', result.token);
    
    var options = {
        access_token : result.token,
        lightbox : {
            closeByClick : false   
        }
    };
    
    var self = this;
    
    var s   = document.createElement('script');
    s.type  = "text/javascript";
    s.async = true;
    s.src   = "//static.xsolla.com/embed/paystation/1.0.7/widget.min.js";
    s.addEventListener('load', function (e) {
        XPayStationWidget.on(XPayStationWidget.eventTypes.CLOSE, function () {
            pc.app.fire('Show:Menu', 'HideLoading');
            pc.app.fire('Page:Menu', 'Shop');
        });
        
        XPayStationWidget.init(options);
        
        setTimeout(function(){
            //self.buyButton.enabled = true;
            XPayStationWidget.open();
        }, 100);
    }, false);
    
    var head = document.getElementsByTagName('head')[0];
    head.appendChild(s);
};

Shop.prototype.onTabChange = function(tabName){
    var _tabName = tabName + '';
    
    if(tabName == 'Offers'){
        _tabName = 'Featured';
    }
    
    this.tabTitleEntity.element.text = _tabName;
    
    this.currentItemIndex = 0;
    
    this.currentTab = tabName;
    this.getItemList();
};

Shop.prototype.getItemList = function(tabName){
    if(this.currentTab == 'Crates'){
        this.app.fire('Fetcher:Crates');   
    }else if(this.currentTab == 'Offers' || this.currentTab == 'Featured'){
        this.app.fire('Fetcher:Offers');
     }else if(this.currentTab == 'Buy VG'){
        this.shopType = 'VirtualCoin';
        this.app.fire('Fetcher:BuyVG');
    }else if(this.currentTab == 'Inventory'){
        this.app.fire('Page:Menu', 'Account');
        
        if(pc.session && typeof pc.session.hash !== 'undefined'){
            setTimeout(function(){
                pc.app.fire('Tab:Profile', 'Inventory');
            }, 100);
        }
    }
};

Shop.prototype.onTransaction = function(number){
    /*
    var price = this.transactionPriceEntity;
        price.setLocalPosition(0, 0, 0);
        price.element.text = '-' + number + ' VG';
    
    price.element.opacity = 1;
    price.tween(price.getLocalPosition()).to({
        x : 0, y : 50, z : 0
    }, 0.4, pc.BackOut).start();
    
    price.tween(price.element).to({
        opacity : 0
    }, 0.4, pc.Linear).start();
    */
};

Shop.prototype.onStateChange = function(state) {
    //this.previewEntity.enabled = state;
};

Shop.prototype.onBuy = function(data){
    if(data.type == 'Crate'){
        this.app.fire('Preview:Open', data.item);
        this.app.fire('Shop:Transaction', data.price);   
    }else{
        this.app.fire('Preview:Buy', data.item);
        this.app.fire('Show:Buy', 'AfterBuy');
        
        this.app.fire('Notify:Notify', data.message);
    }
};

Shop.prototype.onEquip = function(item_id){
    //alert('Equiped!');
    this.app.fire('Fetcher:Equip', { id : item_id });
};

Shop.prototype.onEquiped = function(data){
    //alert('Equiped!');
    this.getItemList();
    this.app.fire('Preview:Equip', true);
};

Shop.prototype.onItemSelect = function(index) {
    this.currentItemIndex = index;
    
    var i = this.items.length;
    
    while(i--){
        this.items[i].element.opacity   = 0.8;
        this.items[i].selection.enabled = false;
    }
    
    var item = this.items[this.currentItemIndex];
    
    if(item){
        item.element.opacity   = 1;
        item.selection.enabled = true;
        this.setPreview(item);
        this.app.fire('Preview:Set', item, item.type);
    }
};  

Shop.prototype.onItemUnlock = function() {
    if(this.buyTimeout){
        return false;
    }
    
    var offer = this.currentItem;

    if(this.shopType == 'Offers'){
        this.app.fire('Fetcher:BuyOffer', { offer_id : offer.id });   
    }else{
        this.app.fire('Fetcher:BuyOffer', { offer_id : offer.id });
        
        this.buyTimeout = true;
        
        setTimeout(function(self){
            self.buyTimeout = false;
        }, 1500, this);
    }
};   

Shop.prototype.showRarities = function(crate, rarities){
    //clear raretities
    var i = this.rarities.length;
    
    while(i--){
        if(this.rarities[i]){
            this.rarities[i].destroy();   
        }
    }
    
    this.rarities = [];
    
    var count = 0;
    
    for(var rarityIndex in rarities){
        var rare = rarities[rarityIndex];
            rare = rare.toLowerCase();
        
        if(this.rarityNumbers[crate][rare]){
            var rareEntity = this.raritiesItem.clone();
                rareEntity.enabled = true;
                rareEntity.element.color = this[rare + 'Color'];
                rareEntity.findByName('Text').element.text = 
                    rare.toUpperCase() + ' (%' + this.rarityNumbers[crate][rare] + ')';
                rareEntity.setLocalPosition(10, -parseInt(count) * 20 - 10, 0);

            this.raritiesEntity.addChild(rareEntity);
            this.rarities.push(rareEntity);
            
            count++;
        }
    }
    
    this.raritiesEntity.element.height = (count * 20) + 15;
};

Shop.prototype.setPreview = function(item) {
    this.itemPriceEntity.element.text  = item.price;
    this.itemRarityColor.element.color = this.getRarityColor(item.rarity);
    this.itemRarityText.element.text   = item.rarity;
    
    this.itemTitle.element.text  = item.name + '';
    this.itemOwner.element.text  = item.owner + '';
    this.itemBackground.element.color = this.getColor(item.color);
    
    this.itemRarityColor.enabled = true;
    this.creatorCodeForm.enabled = false;
    this.raritiesEntity.enabled  = false;
    
    this.showcaseDisplay.enabled = false;
    
    if(item.type == 'Crate'){
        this.buyButton.enabled    = false;
        this.unlockButton.enabled = true;
        this.equipButton.enabled  = false;
        
        this.raritiesEntity.enabled = true;
        this.showRarities(item.name, item.rarity.split(', '));
    }else if(item.type == 'VirtualCoin'){
        this.unlockButton.enabled = false;
        this.equipButton.enabled  = false;
        this.buyButton.enabled    = true;
        this.itemRarityColor.enabled = false;
        
        if(this.contentCreatorCode === '' && !Utils.isMobile()){
            this.creatorCodeForm.enabled = true;   
        }
        
        this.buyPriceEntity.element.text = item.price;
        
        this.currentQuantity = item.quantity;
    }else if(item.unlocked){
        this.buyButton.enabled    = false;
        this.unlockButton.enabled = false;
        this.equipButton.enabled  = true;
        
        if(item.equiped){
            this.equipText.element.text = 'EQUIPED';
            this.equipedIcon.enabled = true;
            this.equipButton.element.color = this.greenColor;
        }else{
            this.equipText.element.text = 'EQUIP';
            this.equipedIcon.enabled = false;
            this.equipButton.element.color = this.grayColor;
        }
        
        this.equipButton.script.button.pressFunction = 'Shop:Equip@' + item.item_id;
    }else{
        this.buyButton.enabled    = false;
        this.equipButton.enabled  = false;
        
        if(item.is_showcase == '1'){
            this.unlockButton.enabled = false;
            this.showcaseDisplay.enabled = true;
        }else{
            this.unlockButton.enabled = true;
            this.showcaseDisplay.enabled = false;
        }
    }
};

Shop.prototype.setShopItems = function(data) {
    if(!data.success){
        return false;
    }
    
    this.clearItems();
    
    var items = data.items;
    
    for(var itemIndex in items){
        var item = items[itemIndex];
        
        this.addShopItem(item, parseInt(itemIndex));
    }
    
    this.app.fire('Shop:Select', this.currentItemIndex);
};

Shop.prototype.clearItems = function(){
    var i = this.items.length;
    
    while(i--){
        this.items[i].destroy();
    }
    
    this.items = [];
};

Shop.prototype.getRarityColor = function(rarity){
    var color = this.commonColor;
    
    if(rarity == 'Common'){
        color = this.commonColor;
    }
    
    if(rarity == 'Uncommon'){
        color = this.uncommonColor;
    }
    
    if(rarity == 'Rare'){
        color = this.rareColor;
    }
    
    if(rarity == 'Legendary'){
        color = this.legendaryColor;
    }
    
    if(rarity == 'Mythical'){
        color = this.mythicalColor;
    }
    
    return color;
};

Shop.prototype.getColor = function(color){
    return Utils.hex2RGB('#' + color);
};

Shop.prototype.addShopItem = function(item, index, type) {
    var itemEntity = false;
    var height = this.height;
    
    if(this.shopType == 'VirtualCoin'){
        itemEntity = this.smallItemEntity.clone();
        height     = this.smallHeight;
    }else{
        itemEntity = this.smallItemEntity.clone();
        height     = this.smallHeight;
        
        //itemEntity = this.itemEntity.clone();
    }
    
        itemEntity.enabled = true;
        itemEntity.setLocalPosition(0, -height * index, 0);
        itemEntity.element.color = this.getColor(item.color);
    
    //properties
    var icon = this.app.assets.find(item.icon);
    
    if(icon){
        itemEntity.findByName('Icon').element.textureAsset = icon;    
    }
    
    itemEntity.findByName('ItemName').element.text = item.name;
    
    var classType = 'Scar-Thumbnail-White.png';
    
    if(item.type == 'ScarSkin'){
        classType = 'Scar-Thumbnail-White.png';
    }
    
    if(item.type == 'ShotgunSkin'){
        classType = 'Shotgun-Thumbnail-White.png';
    }
    
    if(item.type == 'SniperSkin'){
        classType = 'Sniper-Thumbnail-White.png';
    }
    
    if(item.type == 'Tec9Skin'){
        classType = 'Tec-9-Thumbnail-White.png';
    }
    
    if(item.type == 'LiliumDance'){
        classType = 'Dance-Icon.png';
    }
    
    if(item.type == 'ShinDance'){
        classType = 'Dance-Icon.png';
    }
    
    if(item.type == 'WeaponAccessory'){
        classType = 'KeyChain-Icon.png';
    }
    
    if(item.type == 'Crate'){
        classType = 'Loot-Icon.png';
    }

    if(this.shopType == 'Offers'){
        var classIcon = this.app.assets.find(classType);

        if(classIcon){
            //itemEntity.findByName('ClassIcon').element.textureAsset = classIcon;
        }

        //itemEntity.findByName('TimeLeft').element.text = item.offer_end_time;    
    }
    
    itemEntity.rarity = item.rarity;
    itemEntity.price  = item.price;
    itemEntity.color  = item.color;
    itemEntity.name   = item.name;
    itemEntity.owner  = item.owner;
    itemEntity.type   = item.type;
    itemEntity.filename = item.filename;
    itemEntity.unlocked = item.unlocked;
    itemEntity.equiped  = item.equiped;
    itemEntity.item_id  = item.id;
    itemEntity.quantity = item.quantity ? item.quantity : 0;
    itemEntity.is_showcase = item.is_showcase;
    
    itemEntity.script.button.pressFunction = 'Shop:Select@' + index;
    
    itemEntity.element.opacity = 0.8;
    itemEntity.selection = itemEntity.findByName('Selection');
    itemEntity.selection.enabled = false;
    
    this.itemHolder.addChild(itemEntity);
    this.items.push(itemEntity);
};