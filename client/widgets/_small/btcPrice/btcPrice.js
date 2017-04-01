import {readableN} from '/imports/api/client/utils/base'
import {CurrentData} from '/imports/api/collections'
function _btcPrice (){
  var btc = CurrentData.findOne({_id: "Bitcoin"});
  try {// try to return a value
    return parseFloat(btc.metrics.price.usd);
  } catch (err) {// if value undefined return nothing
    return;
  }
}

Template['btcPriceSimple'].helpers({
  price: function(){
    var btcPrice = _btcPrice()
    if (btcPrice) return readableN0( btcPrice, 0 );
    return ''
  }
});
