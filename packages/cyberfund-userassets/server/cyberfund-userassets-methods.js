var logger = log4js.getLogger("assets-tracker");

/**
 * converts crypto-balance token to chaingear system name.
 * @param cryptoBalanceToken - token received from crypto-balance library
 * @returns {CG system name OR false - if autoupdate is disabled.}
 */
CF.UserAssets.tokenCB2systemCG = function(cryptoBalanceToken){
  var matchingTable = {
    'BTC': 'Bitcoin',
    'OA/CFUND': 'cyberFund'
  };
  return matchingTable[cryptoBalanceToken] || false;
}

Meteor.methods({
  cfAssetsUpdateBalance: function (accountKey, address) {
    if (!this.userId) {
      return;
    }
    var sel = {_id: this.userId};
    var accounts = Meteor.users.findOne(sel).accounts || {};

    if (!accountKey) { //todo: update all balances for user
      //
      return;
    }
    if (!address) { //todo: update all balances for account
      //
      return;
    }

    var addressObj = accounts[accountKey] && accounts[accountKey].addresses
      && accounts[accountKey].addresses[address];
    if (!addressObj) return;
    var modify = {$set: {}, $unset: {}};

    var key =  ['accounts', accountKey, 'addresses', address, 'assets'].join(".");
    _.each(addressObj.assets, function(asset, assetKey){
      if (asset.update === 'auto') {
        modify.$unset[[key,assetKey].join('.')] = "true"
      }
    });

    CF.checkBalance(address, Meteor.bindEnvironment(function (err, result) {
        if (!err && result) {
          _.each(result, function (item) {
            if (item.status != 'success') return;

            item.asset = CF.UserAssets.tokenCB2systemCG(item.asset);
            if (!item.asset) return;

            var q;
            try {
              q = parseFloat(item.quantity)
            } catch (e) {
              q = item.quantity;
            }
            var k = [key, item.asset].join(".");
            modify.$set[k] = {
              update: 'auto',
              quantity: q,
              asset: item.asset,
              updatedAt: new Date(),
              service: item.service,
              address: item.address
            }
            delete modify.$unset[k];
          });

          // clear empty modifiers
          if (_.isEmpty(modify.$unset)) delete(modify.$unset);
          if (_.isEmpty(modify.$set)) delete(modify.$set);

          // if modifier not empty
          if (_.keys(modify).length) {
            Meteor.users.update(sel, modify);
          }
        }
      })
    );
  },

  "cfAssetsAddAddress": function (accountKey, address) {
    if (!this.userId) return;
    var userId = this.userId;
    var key = ["accounts", accountKey, "addresses", address].join(".");
    var set = {$set :{}};
    set.$set[key] = {assets: {}};
    //push account to dictionary of accounts, so can use in autocomplete later
    Meteor.users.update({_id: userId}, set);
    Meteor.call("cfAssetsUpdateBalance", accountKey, address)
  },

  cfAssetsRemoveAddress: function (accountKey, asset) {
    var userId = this.userId;
    if (!userId) return;
    var key = ['accounts', accountKey, "addresses", asset].join(".");
    var unset = {$unset:{}};
    unset.$unset[key] = true;
    Meteor.users.update({_id: userId}, unset);
  },

  cfAssetsAddAccount: function(obj){
    if (!this.userId) return {err:"no userid"};
    var sel = {_id: this.userId};
    check (obj, Match.ObjectIncluding({isPublic: Boolean, name: String}) );
    var user = Meteor.users.findOne(sel);
    if (!user.accounts) Meteor.users.update(sel, {$set: {accounts: {}}});

    if (!CF.UserAssets.accountNameIsValid(obj.name, user.accounts)) return {err:"invalid acc name"};
    var key = CF.UserAssets.nextKey(user.accounts);
    var $set = {};
    $set['accounts.'+key] = {
      name: obj.name,
      isPublic: obj.isPublic,
      addresses: {}
    };
    var r = Meteor.users.update(sel, {$set: $set});
    if (obj.address) Meteor.call('cfAssetsAddAddress', key, obj.address);
    return {newAccountKey: key};
  },

  cfAssetsRenameAccount: function(key, newName){
    if (!this.userId) return;
    var sel = {_id: this.userId};
    var accounts = Meteor.users.findOne(sel).accounts;
    if (!accounts || !accounts[key]) {
      return;
    }
    var checkName = CF.UserAssets.accountNameIsValid(newName, accounts, accounts[key].name);
    if (checkName) {
      var k = 'accounts.' + key + ".name";
      var set = {$set: {}};
      set.$set[k] = newName;
      Meteor.users.update(sel, set);
    }
  },
  cfAssetsRemoveAccount: function(key) {
    if (!this.userId) return;
    var k = 'accounts.'+ key;
    var unset = {$unset: {}};
    unset.$unset[k] = true;
    Meteor.users.update({_id: this.userId}, unset);
  },
  cfAssetsAddAsset: function(account, address, asset, q){
    if (!this.userId) return;
    var sel = {_id: this.userId};
    var modify = {$set: {}};
    var key = ['accounts',account,'addresses',address,'assets',asset].join(".");
    modify.$set[key] = {
      asset: asset,
      quantity: q,
      update:'manual'
    }
    Meteor.users.update(sel, modify)
  },
  cfAssetsDeleteAsset: function(account, address, asset) {
    if (!this.userId) return;
    var sel = {_id: this.userId};
    var modify = {$unset: {}};
    var key = ['accounts',account,'addresses',address,'assets',asset].join(".");
    modify.$unset[key] = true;
    Meteor.users.update(sel, modify)
  }
});