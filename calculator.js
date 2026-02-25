// Çek listesi için array
let checks = [];

// Düzenleme modunu takip etmek için değişken
let isEditing = false;

// Para formatı için yardımcı fonksiyon
const formatMoney = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
};

// String'den sayıya çevirme (noktalı ve virgüllü formatı temizleme)
const parseMoneyValue = (value) => {
    if (!value) return 0;
    // Önce bin ayracı olan noktaları kaldır
    value = value.replace(/\./g, '');
    // Virgülü noktaya çevir
    value = value.replace(',', '.');
    // TL yazısını kaldır
    value = value.replace(' TL', '');
    return parseFloat(value);
};

// Input para formatı için yardımcı fonksiyon
const formatMoneyInput = (value) => {
    // TL yazısını kaldır
    value = value.replace(' TL', '');
    
    // Eğer değer boşsa, boş string döndür
    if (!value) return '';
    
    // Virgül kontrolü
    let hasComma = value.includes(',');
    let decimalPart = '';
    
    if (hasComma) {
        let parts = value.split(',');
        value = parts[0];
        // En fazla 2 decimal basamak al
        decimalPart = ',' + (parts[1] || '').slice(0, 2);
    }
    
    // Sadece rakamları al (noktalar hariç)
    value = value.replace(/[^\d.]/g, '');
    
    // Tüm noktaları kaldır
    value = value.replace(/\./g, '');
    
    // Boş string kontrolü
    if (!value) return '';
    
    // 1000'lik gruplar için nokta ekle
    value = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    // Virgüllü kısım varsa ekle
    value = value + decimalPart;
    
    return value + ' TL';
};

// Tarih formatı için yardımcı fonksiyon
const formatDate = (date) => {
    return new Intl.DateTimeFormat('tr-TR').format(new Date(date));
};

// Ağırlıklı ortalama tarih hesaplama
const calculateWeightedAverageDate = (checks) => {
    // Her çek için tarih * tutar çarpımlarının toplamı
    let weightedSum = 0;
    // Toplam tutar
    let totalAmount = 0;

    checks.forEach(check => {
        const dateValue = new Date(check.dueDate).getTime(); // Tarihi milisaniye cinsine çevir
        weightedSum += dateValue * check.amount;
        totalAmount += check.amount;
    });

    // Ağırlıklı ortalama tarihi hesapla
    const weightedAverageTime = Math.round(weightedSum / totalAmount);
    return new Date(weightedAverageTime);
};

// Günler arasındaki farkı hesaplama
const calculateDaysDifference = (averageDate) => {
    const calculationDateInput = document.getElementById('calculationDate');
    const calculationDate = new Date(calculationDateInput.value);
    calculationDate.setHours(0, 0, 0, 0); // Hesaplama tarihinin başlangıcına ayarla
    
    const avgDate = new Date(averageDate);
    avgDate.setHours(0, 0, 0, 0); // Karşılaştırma için saatleri sıfırla
    
    // Milisaniyeyi güne çevirme (1000ms * 60sn * 60dk * 24sa)
    return Math.round((avgDate - calculationDate) / (1000 * 60 * 60 * 24));
};

// Tüm çekleri hesaplama
function calculateAllChecks() {
    // Düzenleme modunda ve liste boşsa hesaplama yapma
    if (checks.length === 0 && !isEditing) {
        alert('Lütfen önce çek ekleyiniz!');
        return;
    }
    
    if (checks.length === 0) {
        document.getElementById('resultsSection').classList.add('hidden');
        return;
    }

    const totalAmount = checks.reduce((sum, check) => sum + check.amount, 0);
    const averageAmount = totalAmount / checks.length;
    const weightedAverageDate = calculateWeightedAverageDate(checks);
    const daysDifference = calculateDaysDifference(weightedAverageDate);

    displayResults(totalAmount, averageAmount, weightedAverageDate, daysDifference);
}

// Sonuçları görüntüleme
function displayResults(totalAmount, averageAmount, averageDate, daysDifference) {
    const resultsSection = document.getElementById('resultsSection');
    const resultsSummary = document.getElementById('resultsSummary');
    const pdfButton = document.getElementById('pdfButton');


    // displayResults fonksiyonunda
pdfButton.classList.remove('hidden');

// Çek listesi boşsa (updateCheckList fonksiyonunda)
if (checks.length === 0) {
    document.getElementById('resultsSection').classList.add('hidden');
}
    
    const dayText = daysDifference === 0 
        ? 'Bugün'
        : daysDifference > 0 
            ? `${daysDifference} Gün Sonra` 
            : `${Math.abs(daysDifference)} Gün Önce`;

            resultsSummary.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="bg-white p-4 rounded-lg shadow-sm">
            <div class="text-sm text-gray-500 mb-1">Toplam Tutar</div>
            <div class="text-xl font-semibold">${formatMoney(totalAmount)} TL</div>
        </div>
        <div class="bg-white p-4 rounded-lg shadow-sm">
            <div class="text-sm text-gray-500 mb-1">Ortalama Tutar</div>
            <div class="text-xl font-semibold">${formatMoney(averageAmount)} TL</div>
        </div>
        <div class="bg-white p-4 rounded-lg shadow-sm">
            <div class="text-sm text-gray-500 mb-1">Ortalama Vade Tarihi</div>
            <div class="text-xl font-semibold">${formatDate(averageDate)}</div>
        </div>
        <div class="bg-white p-4 rounded-lg shadow-sm">
            <div class="text-sm text-gray-500 mb-1">Vade Günü</div>
            <div class="text-xl font-semibold">${dayText}</div>
        </div>
    </div>
    
`;

    resultsSection.classList.remove('hidden');
    // Çek varsa PDF butonunu göster
    pdfButton.classList.remove('hidden');
}

// Çek listesini güncelleme
function updateCheckList() {
    const checkList = document.getElementById('checkList');
    checkList.innerHTML = '';

    // Çekleri tarihe göre sırala (eskiden yeniye)
    const sortedChecks = [...checks].sort((a, b) => {
        return new Date(a.dueDate) - new Date(b.dueDate);
    });

    sortedChecks.forEach((check, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-2 py-2 w-[10%]">${index + 1}</td>
            <td class="px-2 py-2 w-[25%]">${formatDate(check.dueDate)}</td>
            <td class="px-2 py-2 w-[25%] whitespace-nowrap font-medium">${formatMoney(check.amount)}&nbsp;TL</td>
            <td class="px-2 py-2 w-[20%] text-center">${check.type.charAt(0)}</td>
            <td class="px-2 py-2 w-[20%]">
                <div class="flex space-x-1">
                    <button onclick="removeCheck(${check.id})" class="text-red-600 hover:text-red-800">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                        </svg>
                    </button>
                    <button onclick="editCheck(${check.id})" class="text-blue-600 hover:text-blue-800">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                    </button>
                </div>
            </td>
        `;
        checkList.appendChild(row);
    });

    // Liste boşsa PDF butonunu gizle
    if (checks.length === 0) {
        pdfButton.classList.add('hidden');
    }
}

// PDF indirme fonksiyonu
function downloadPDF() {
    // PDF indirme mantığı buraya eklenecek
    alert('PDF indirme özelliği yakında eklenecek');
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', function() {
    const dateInput = document.getElementById('checkDate');
    const amountInput = document.getElementById('checkAmount');
    const calculationDateInput = document.getElementById('calculationDate');
    const checkTypeInput = document.getElementById('checkType');
    const checkTypeLabel = document.getElementById('checkTypeLabel');
    const toggleBackground = document.getElementById('toggleBackground');
    const toggleCircle = document.getElementById('toggleCircle');

    function updateToggle() {
        if (checkTypeInput.checked) {
            toggleBackground.style.backgroundColor = '#10B981'; // yeşil
            toggleCircle.style.transform = 'translateX(-16px)';
            checkTypeLabel.textContent = 'Firma Çeki';
        } else {
            toggleBackground.style.backgroundColor = '#D1D5DB'; // gri
            toggleCircle.style.transform = 'translateX(0)';
            checkTypeLabel.textContent = 'Ciro Edilen Çek';
        }
    }

    // Başlangıç durumu için
    updateToggle();

    // Değişim durumu için
    checkTypeInput.addEventListener('change', updateToggle);

    // + tuşu için klavye kontrolü
    document.addEventListener('keydown', function(event) {
        if (event.key === '+' || event.key === 'NumpadAdd') {
            checkTypeInput.checked = !checkTypeInput.checked;
            updateToggle();
        }
    });

    // Hesaplama tarihi için bugünün tarihini set et
    const today = new Date();
    calculationDateInput.valueAsDate = today;

    // Hesaplama tarihi değiştiğinde sonuçları güncelle
    calculationDateInput.addEventListener('change', function() {
        if (checks.length > 0) {
            calculateAllChecks();
        }
    });

    // Tarih inputunda enter tuşuna basılınca
    dateInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            amountInput.focus();
        }
    });

    // Tutar inputu için event listener'lar
amountInput.addEventListener('input', function(e) {
    // Sadece rakamları ve virgülü al
    let value = this.value.replace(/[^\d,]/g, '');
    
    // Birden fazla virgül varsa ilkini bırak
    let commaCount = (value.match(/,/g) || []).length;
    if (commaCount > 1) {
        let parts = value.split(',');
        value = parts[0] + ',' + parts.slice(1).join('');
    }
    
    // Başındaki sıfırları kaldır
    value = value.replace(/^0+/, '');
    
    // Eğer değer boşsa, input'u temizle
    if (!value) {
        this.value = '';
        return;
    }
    
    // Sayısal kısmı formatla
    let parts = value.split(',');
    let numericValue = parseInt(parts[0] || '0');
    
    // Ana kısmı formatla ve virgülden sonraki kısmı ekle
    this.value = numericValue.toLocaleString('tr-TR') + (parts.length > 1 ? ',' + parts[1].slice(0, 2) : '');
});

    // Enter tuşu için event listener
    amountInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addCheck();
        }
    });

    // Backspace kontrolü için event listener
    amountInput.addEventListener('keydown', function(e) {
        if (e.key === 'Backspace' && this.value === ' TL') {
            this.value = '';
            previousValue = '';
            e.preventDefault();
        }
    });
});


    


// Çek ekleme fonksiyonu
function addCheck() {
    const dateInput = document.getElementById('checkDate');
    const amountInput = document.getElementById('checkAmount');

    // Tarih kontrolü
    if (!dateInput.value) {
        alert('Tarih Bilgisini Yanlış Girdiniz!');
        dateInput.focus();
        return;
    }

    // Geçerli tarih kontrolü
    const dateValue = new Date(dateInput.value);
    if (isNaN(dateValue.getTime())) {
        alert('Tarih Bilgisini Yanlış Girdiniz!');
        dateInput.focus();
        return;
    }

    // Tutar kontrolü
    if (!amountInput.value) {
        alert('Lütfen tutar giriniz!');
        amountInput.focus();
        return;
    }

    const amount = parseMoneyValue(amountInput.value);
    if (amount <= 0) {
        alert('Lütfen geçerli bir tutar giriniz!');
        amountInput.focus();
        return;
    }

    const check = {
        id: Date.now(),
        date: dateInput.value,
        amount: amount,
        dueDate: dateInput.value,
        type: document.getElementById('checkTypeLabel').textContent
    };

    checks.push(check);
    updateCheckList();
    clearForm();
    
    // Düzenleme modunu kapat
    isEditing = false;
    
    calculateAllChecks();
}

// Formu temizleme
function clearForm() {
    const dateInput = document.getElementById('checkDate');
    const amountInput = document.getElementById('checkAmount');
    
    dateInput.value = '';
    amountInput.value = '';
    dateInput.focus();
}

// Çek düzenleme fonksiyonu
function editCheck(id) {
    const check = checks.find(c => c.id === id);
    if (!check) return;

    // Düzenleme modunu aktif et
    isEditing = true;

    const dateInput = document.getElementById('checkDate');
    const amountInput = document.getElementById('checkAmount');

    // Sadece tarihi set et, tutarı boş bırak
    dateInput.value = check.date;
    amountInput.value = '';
    
    // Tarih input'una odaklan
    dateInput.focus();
    
    // Çeki listeden kaldır ama hesaplama yapma
    checks = checks.filter(check => check.id !== id);
    updateCheckList();
    
    // Eğer başka çek varsa hesapla
    if (checks.length > 0) {
        calculateAllChecks();
    } else {
        // Liste boşsa sonuç bölümünü gizle
        document.getElementById('resultsSection').classList.add('hidden');
    }
}





// Çek silme fonksiyonu
function removeCheck(id) {
    checks = checks.filter(check => check.id !== id);
    updateCheckList();
    calculateAllChecks(); // Çek silindiğinde de hesaplama yap
}
//***********************************PDF İndir Fonksiyonu************************************/
function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Kenar boşlukları (mm cinsinden)
    const margin = {
        top: 25,
        bottom: 20,
        left: 20,
        right: 10
    };
    
    // Sayfa boyutları
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Y pozisyonunu takip etmek için
    let y = margin.top;
    
    // Başlık kısmı
    doc.setFontSize(8);
    doc.text("Cek Vade Analiz Raporu", margin.left, 10);
    doc.text(formatDate(new Date()), pageWidth - margin.right - 20, 10);
    
    // Ana başlık
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    const title = "CEK VADE ANALIZ RAPORU";
    doc.text(title, (pageWidth - doc.getTextWidth(title)) / 2, y);
    
    // İlk çizgi
    doc.setLineWidth(0.2);
    doc.line(margin.left, y + 5, pageWidth - margin.right, y + 5);
    
    // Tarih ve Referans
    y += 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const currentDate = new Date();
    const refNo = `REF-${currentDate.getFullYear()}${String(currentDate.getMonth() + 1).padStart(2, '0')}${String(currentDate.getDate()).padStart(2, '0')}-${String(currentDate.getHours()).padStart(2, '0')}${String(currentDate.getMinutes()).padStart(2, '0')}`;
    
    doc.text(`Rapor Tarihi : ${formatDate(currentDate)}`, margin.left, y);
    y += 5;
    doc.text(`Referans No : ${refNo}`, margin.left, y);
    
    // İkinci çizgi
    doc.line(margin.left, y + 5, pageWidth - margin.right, y + 5);
    
    // Özet Bilgiler
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("OZET BILGILER", margin.left, y);
    
    // Özet verileri
    const totalAmount = checks.reduce((sum, check) => sum + check.amount, 0);
    const averageAmount = totalAmount / checks.length;
    const weightedAverageDate = calculateWeightedAverageDate(checks);
    const calculationDate = document.getElementById('calculationDate').value;
    const daysDifference = calculateDaysDifference(weightedAverageDate);
    
    y += 10;
    doc.setFont("helvetica", "normal");
    // Hizalı özet bilgileri
    const labelWidth = margin.left + 45;
    doc.text("Toplam Cek Adedi", margin.left, y);
    doc.text(":", labelWidth, y);
    doc.text(`${checks.length} Adet`, labelWidth + 5, y);
    
    y += 6;
    doc.text("Toplam Tutar", margin.left, y);
    doc.text(":", labelWidth, y);
    doc.text(`${formatMoney(totalAmount)} TL`, labelWidth + 5, y);
    
    y += 6;
    doc.text("Ortalama Cek Tutari", margin.left, y);
    doc.text(":", labelWidth, y);
    doc.text(`${formatMoney(averageAmount)} TL`, labelWidth + 5, y);

    y += 6;
    doc.text("Hesaplama Tarihi", margin.left, y);
    doc.text(":", labelWidth, y);
    doc.text(formatDate(new Date(calculationDate)), labelWidth + 5, y);
    
    y += 6;
    doc.text("Ortalama Vade Tarihi", margin.left, y);
    doc.text(":", labelWidth, y);
    doc.text(formatDate(weightedAverageDate), labelWidth + 5, y);
    
    y += 6;
    doc.text("Ortalama Vade", margin.left, y);
    doc.text(":", labelWidth, y);
    doc.text(daysDifference === 0 ? 'Bugun' : daysDifference > 0 ? `${daysDifference} Gun Sonra` : `${Math.abs(daysDifference)} Gun Once`, labelWidth + 5, y);
    
    // Üçüncü çizgi
    doc.line(margin.left, y + 5, pageWidth - margin.right, y + 5);
    
    // Çek Listesi başlığı
    y += 15;
    doc.setFont("helvetica", "bold");
    doc.text("CEK LISTESI", margin.left, y);
    
    // Tablo başlıkları
    y += 10;
    doc.text("No", margin.left, y);
    doc.text("Vade Tarihi", margin.left + 20, y);
    doc.text("Tutar", margin.left + 60, y);
    doc.text("Cek Turu", margin.left + 100, y);
    doc.text("Kalan Gun", margin.left + 130, y);
    doc.text("Durum", margin.left + 160, y);
    
    // Tablo başlığı altına çizgi
    doc.line(margin.left, y + 2, pageWidth - margin.right, y + 2);
    
    // Çek listesi
    doc.setFont("helvetica", "normal");
    const sortedChecks = [...checks].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    sortedChecks.forEach((check, index) => {
        y += 7;
        
        // Sayfa kontrolü - 18'in katları sonrası veya sayfa sonu kontrolü
        if (y > pageHeight - margin.bottom || (index > 0 && index % 18 === 0)) {
            doc.addPage();
            // Header bilgilerini yeni sayfaya ekle
            y = margin.top;
            doc.setFontSize(8);
            doc.text("Cek Vade Analiz Raporu", margin.left, 10);
            doc.text(formatDate(new Date()), pageWidth - margin.right - 20, 10);
            
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text("CEK VADE ANALIZ RAPORU", (pageWidth - doc.getTextWidth("CEK VADE ANALIZ RAPORU")) / 2, y);
            
            // Çizgi
            doc.line(margin.left, y + 5, pageWidth - margin.right, y + 5);
            
            y += 10;
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`Rapor Tarihi : ${formatDate(currentDate)}`, margin.left, y);
            y += 5;
            doc.text(`Referans No : ${refNo}`, margin.left, y);
            
            // Çizgi
            doc.line(margin.left, y + 5, pageWidth - margin.right, y + 5);
            
            y += 10;
            doc.setFont("helvetica", "bold");
            doc.text("OZET BILGILER", margin.left, y);
            
            y += 10;
            doc.setFont("helvetica", "normal");
            
            // Hizalı özet bilgileri tekrarı
            doc.text("Toplam Cek Adedi", margin.left, y);
            doc.text(":", labelWidth, y);
            doc.text(`${checks.length} Adet`, labelWidth + 5, y);
            
            y += 6;
            doc.text("Toplam Tutar", margin.left, y);
            doc.text(":", labelWidth, y);
            doc.text(`${formatMoney(totalAmount)} TL`, labelWidth + 5, y);
            
            y += 6;
            doc.text("Ortalama Cek Tutari", margin.left, y);
            doc.text(":", labelWidth, y);
            doc.text(`${formatMoney(averageAmount)} TL`, labelWidth + 5, y);

            y += 6;
            doc.text("Hesaplama Tarihi", margin.left, y);
            doc.text(":", labelWidth, y);
            doc.text(formatDate(new Date(calculationDate)), labelWidth + 5, y);
            
            y += 6;
            doc.text("Ortalama Vade Tarihi", margin.left, y);
            doc.text(":", labelWidth, y);
            doc.text(formatDate(weightedAverageDate), labelWidth + 5, y);
            
            y += 6;
            doc.text("Ortalama Vade", margin.left, y);
            doc.text(":", labelWidth, y);
            doc.text(daysDifference === 0 ? 'Bugun' : daysDifference > 0 ? `${daysDifference} Gun Sonra` : `${Math.abs(daysDifference)} Gun Once`, labelWidth + 5, y);
            
            // Çizgi
            doc.line(margin.left, y + 5, pageWidth - margin.right, y + 5);
            
            y += 15;
            doc.setFont("helvetica", "bold");
            doc.text("CEK LISTESI", margin.left, y);
            
            y += 10;
            doc.text("No", margin.left, y);
            doc.text("Vade Tarihi", margin.left + 20, y);
            doc.text("Tutar", margin.left + 60, y);
            doc.text("Cek Turu", margin.left + 100, y);
            doc.text("Kalan Gun", margin.left + 130, y);
            doc.text("Durum", margin.left + 160, y);
            
            // Tablo başlığı altına çizgi
            doc.line(margin.left, y + 2, pageWidth - margin.right, y + 2);
            
            y += 7;
            doc.setFont("helvetica", "normal");
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(check.dueDate);
        checkDate.setHours(0, 0, 0, 0);
        const checkDaysDiff = Math.round((checkDate - today) / (1000 * 60 * 60 * 24));
        
        doc.text((index + 1).toString(), margin.left, y);
        doc.text(formatDate(check.dueDate), margin.left + 20, y);
        doc.text(`${formatMoney(check.amount)} TL`, margin.left + 60, y);
        doc.text(check.type.charAt(0) === 'F' ? 'Firma Ceki' : 'Ciro Edilmis', margin.left + 100, y);
        doc.text(checkDaysDiff === 0 ? 'Bugun' : Math.abs(checkDaysDiff).toString(), margin.left + 130, y);
        doc.text(checkDaysDiff === 0 ? 'BUGUN' : checkDaysDiff < 0 ? 'GECMIS' : 'GELECEK', margin.left + 160, y);
        
        // Her çek satırı altına çizgi
        doc.setLineWidth(0.1);
        doc.line(margin.left, y + 2, pageWidth - margin.right, y + 2);
    });
    
    // Sayfa sonu
    y += 10;
    // Dipnotlar (7 punto)
    //doc.setFontSize(7);
    //doc.text("Dip Notlar:", margin.left, y);
   //y += 5;
    //doc.text("• Ortalama Vade, Ortalama Vade Tarihinden Hesaplama Tarihini cikarilarak gun bazinda hesaplanmaktadir.", margin.left, y);
    //y += 3;
    //doc.text("• Çeklerdeki kalan gun sayisi, cekin vade tarihinden bugunun tarihi (Rapor Tarihi) cikarilarak hesaplanmaktadir.", margin.left, y);
    //y += 3;
    //doc.text("• Çek turu, Firma Çeki ve Ciro Edilen Çek olmak uzere iki baslikta sunulmustur. Ciro Edilen Cek, cekin baska bir firmadan alindigini, Firma Ceki ise ceki firmanin kendisnin yazdigini göstermektedir.", margin.left, y);
    //y += 3;
    //doc.text("• Durum, girilen ceklerin ileri tarihli olup olmadiklarini denetleyen kontrol sutunudur. Yanlis tarihli cek giriini engellemez fakat denetler.", margin.left, y);
    
    // Sayfa sonu yazıları
y += 10;
doc.setFontSize(10);
doc.text("*****Sayfa Sonudur*****", (pageWidth - doc.getTextWidth("*****Sayfa Sonudur*****")) / 2, y);
y += 5;
doc.text("Bu Sayfadan Sonra Herhangi Bir Bilgi Basilmamistir", (pageWidth - doc.getTextWidth("Bu Sayfadan Sonra Herhangi Bir Bilgi Basilmamistir")) / 2, y);

// Sayfa numaralarını ve telif hakkı bilgisini ekle
const pageCount = doc.internal.getNumberOfPages();
for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(5);
   
    // Logo - Base64 Code
    const logoBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAAGQCAYAAACAvzbMAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAGwGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNy4xLWMwMDAgMTE2LmNjZjg0ZTAsIDIwMjIvMDUvMTktMTA6NTk6NDcgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCAyMi41IChXaW5kb3dzKSIgeG1wOkNyZWF0ZURhdGU9IjIwMjQtMDEtMzBUMTE6MzQ6MjIrMDM6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDI1LTAxLTIxVDE0OjAyOjAxKzAzOjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDI1LTAxLTIxVDE0OjAyOjAxKzAzOjAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9InNSR0IgSUVDNjE5NjYtMi4xIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjA2YjE2MWRmLTQ2MmQtMmQ0Zi05Y2U0LTEyMTU3OWZmNGRhNyIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjM3YzE2YjEzLTBiN2EtZWU0MS05Y2RkLWJmODE5YzQyMTA3ZiIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOmVhMDllOTJjLTg1MzctMTI0Yy1hYzQ1LTBiYjg2NzVlZjk0YSI+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6ZWEwOWU5MmMtODUzNy0xMjRjLWFjNDUtMGJiODY3NWVmOTRhIiBzdEV2dDp3aGVuPSIyMDI0LTAxLTMwVDExOjM0OjIyKzAzOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjIuNSAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjkyNzVmYjA0LWU1MDQtMmQ0OC1hNjAzLWJiNTAwOWVkM2E4ZiIgc3RFdnQ6d2hlbj0iMjAyNC0wMS0zMFQxMjoyNjoxOSswMzowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIyLjUgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDowNmIxNjFkZi00NjJkLTJkNGYtOWNlNC0xMjE1NzlmZjRkYTciIHN0RXZ0OndoZW49IjIwMjUtMDEtMjFUMTQ6MDI6MDErMDM6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi41IChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz58Mw3BAABA2klE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"; // Base64 kodunuzu buraya ekleyin
    doc.addImage(logoBase64, "PNG", margin.left, pageHeight - 23, 15, 15); // Boyut ve konumu ihtiyaca göre ayarlayabilirsiniz
   
    // Telif hakkı metni
    doc.setFont("helvetica", "normal");
   
    const copyrightSentences = [
        "© 2025 V. Murat YAVUZ.",
        "Bu rapor, VM tarafindan gelistirilen Cek Vade Hesaplama Programi kullanilarak olusturulmustur. Tum haklari saklidir.",
        "Bu belge sadece bilgi amaclidir, mali veya hukuki bir deger tasimaz. Izinsiz cogaltilamaz, dagitilamaz ve degistirilemez.",
    ];
   
    copyrightSentences.forEach((sentence, index) => {
        const textWidth = doc.getTextWidth(sentence);
        const xPosition = (pageWidth - textWidth) / 2;
        doc.text(sentence, xPosition, pageHeight - 22 + (index * 4));
    });
   
    // Sayfa numarası
    doc.setFontSize(8)
    doc.text(`Sayfa ${i} / ${pageCount}`, pageWidth - margin.right - 25, pageHeight - 15);
}

doc.save(`cek-vade-raporu-${refNo}.pdf`);}