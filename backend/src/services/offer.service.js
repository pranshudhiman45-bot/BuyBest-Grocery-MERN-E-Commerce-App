const bankOffers = [
  {
    id: 1,
    bank: 'HDFC Bank',
    offer: '10% cashback up to Rs 150 on credit cards'
  },
  {
    id: 2,
    bank: 'ICICI Bank',
    offer: 'Flat Rs 100 off on debit cards'
  }
]

const listBankOffers = async () => bankOffers

module.exports = {
  listBankOffers
}
