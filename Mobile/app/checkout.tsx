import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput, Modal, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { useAuth } from '../src/contexts/AuthContext';
import { useCart } from '../src/contexts/CartContext';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../src/constants';
import { useColors } from '../src/hooks/useColors';
import httpClient from '../src/api/httpClient';

type CheckoutStep = 'user-data' | 'addresses' | 'payment' | 'review';

interface Address {
  id: string;
  nome: string;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  cep: string;
  latitude?: number;
  longitude?: number;
}

export default function CheckoutScreen() {
  const router = useRouter();
  const { isAuthenticated, user, updateUser, checkAuthStatus } = useAuth();
  const { items, restaurant, subtotal, deliveryFee, total, isCartEmpty } = useCart();
  const colors = useColors();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('user-data');
  const [userData, setUserData] = useState({
    fullName: user?.fullName || user?.nome || '',
    email: user?.email || '',
    phone: user?.telefone || '',
  });
  const [userDataErrors, setUserDataErrors] = useState({
    fullName: '',
    email: '',
    phone: '',
  });
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [userAddresses, setUserAddresses] = useState<Address[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [isAddAddressModalVisible, setIsAddAddressModalVisible] = useState(false);
  const [newAddress, setNewAddress] = useState({
    nome: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    cep: '',
    latitude: null,
    longitude: null,
  });
  const [addressErrors, setAddressErrors] = useState({
    nome: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    cep: '',
  });
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showCoordinatesObtained, setShowCoordinatesObtained] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 41.2704,
    longitude: -8.0818,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: 41.2704,
    longitude: -8.0818,
  });

  const steps = [
    { key: 'user-data', title: 'Meus dados', icon: 'person' },
    { key: 'addresses', title: 'Endereços', icon: 'location-on' },
    { key: 'review', title: 'Revisar Pedido', icon: 'check-circle' },
    { key: 'payment', title: 'Pagamento', icon: 'payment' },
  ];

  // Detectar se é tablet (largura > 600px) - memoizado para evitar recálculos
  const isTablet = useMemo(() => {
    const screenWidth = Dimensions.get('window').width;
    return screenWidth > 600;
  }, []);

  // Função para buscar endereços do usuário
  const fetchUserAddresses = useCallback(async () => {
    if (!isAuthenticated || !user) {
      console.log('❌ Usuário não autenticado ou dados não carregados');
      return;
    }
    
    try {
      console.log('🔄 Buscando endereços do usuário...');
      console.log('👤 Usuário:', user);
      console.log('🏠 enderecosSalvos:', (user as any).enderecosSalvos);
      
      setIsLoadingAddresses(true);
      
      // Os endereços estão no campo enderecosSalvos do usuário
      if ((user as any).enderecosSalvos && Array.isArray((user as any).enderecosSalvos)) {
        console.log('✅ Endereços encontrados no usuário:', (user as any).enderecosSalvos);
        setUserAddresses((user as any).enderecosSalvos);
      } else {
        console.log('⚠️ Nenhum endereço salvo encontrado');
        setUserAddresses([]);
      }
    } catch (error) {
      console.error('❌ Erro ao processar endereços:', error);
      Alert.alert('Erro', 'Não foi possível carregar seus endereços');
      setUserAddresses([]);
    } finally {
      setIsLoadingAddresses(false);
    }
  }, [isAuthenticated, user]);

  // Buscar dados completos do usuário quando autenticado ou quando chega na página
  useEffect(() => {
    if (isAuthenticated && (!user?.telefone || !user?.enderecosSalvos)) {
      // Buscar dados atualizados apenas se não tiver telefone ou endereços
      // Isso garante que temos telefone e endereços atualizados
      const fetchUserData = async () => {
        try {
          console.log('🔄 Buscando dados do usuário no checkout...');
          await checkAuthStatus();
          console.log('✅ checkAuthStatus concluído');
        } catch (error) {
          console.error('❌ Erro ao buscar dados do usuário:', error);
        }
      };
      fetchUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]); // Não incluir checkAuthStatus para evitar loop

  // Atualizar dados do usuário quando user estiver disponível
  useEffect(() => {
    if (user) {
      console.log('📝 Atualizando userData no checkout:', {
        fullName: user.fullName || user.nome,
        email: user.email,
        telefone: user.telefone,
      });
      setUserData({
        fullName: user.fullName || user.nome || '',
        email: user.email || '',
        phone: user.telefone || '',
      });
    }
  }, [user]);

  // Buscar endereços quando o componente montar ou quando user mudar
  useEffect(() => {
    console.log('🔍 useEffect fetchUserAddresses - isAuthenticated:', isAuthenticated);
    console.log('🔍 useEffect fetchUserAddresses - user:', user);
    
    if (isAuthenticated && user) {
      fetchUserAddresses();
    } else {
      console.log('❌ Usuário não autenticado, não buscando endereços');
      setUserAddresses([]);
    }
  }, [isAuthenticated, user, fetchUserAddresses]);

  // Sincronizar selectedLocation com newAddress quando houver coordenadas
  useEffect(() => {
    if (newAddress.latitude && newAddress.longitude) {
      setSelectedLocation({
        latitude: newAddress.latitude,
        longitude: newAddress.longitude,
      });
    }
  }, [newAddress.latitude, newAddress.longitude]);

  // Obter localização automaticamente quando o modal de adicionar endereço abrir
  useEffect(() => {
    if (isAddAddressModalVisible && !newAddress.latitude && !newAddress.longitude) {
      const getAutoLocation = async () => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          
          if (status === 'granted') {
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High,
            });

            setNewAddress(prev => ({
              ...prev,
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }));

            setSelectedLocation({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });

            setShowCoordinatesObtained(true);
            
            setTimeout(() => {
              setShowCoordinatesObtained(false);
            }, 3000);
          }
        } catch (error) {
          console.error('Erro ao obter localização automática:', error);
          // Não exibir alerta para não incomodar o usuário
        }
      };

      getAutoLocation();
    }
  }, [isAddAddressModalVisible]);

  const currentStepIndex = steps.findIndex(step => step.key === currentStep);

  const validateUserData = () => {
    const errors = {
      fullName: '',
      email: '',
      phone: '',
    };

    // Validar nome completo
    if (!userData.fullName.trim()) {
      errors.fullName = 'Nome completo é obrigatório';
    }

    // Validar email
    if (!userData.email.trim()) {
      errors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(userData.email)) {
      errors.email = 'Email inválido';
    }

    // Validar telefone - OBRIGATÓRIO
    if (!userData.phone.trim()) {
      errors.phone = 'Telefone é obrigatório';
    }

    setUserDataErrors(errors);
    const isValid = !errors.fullName && !errors.email && !errors.phone;
    
    if (!isValid) {
      Alert.alert(
        'Dados Incompletos',
        'Por favor, preencha todos os campos obrigatórios: Nome, Email e Telefone.',
        [{ text: 'OK' }]
      );
    }
    
    return isValid;
  };
  
  // Validar se tem endereço selecionado
  const validateAddress = () => {
    if (!selectedAddress) {
      Alert.alert(
        'Endereço Necessário',
        'Você precisa selecionar um endereço salvo ou adicionar um novo endereço antes de continuar.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const updateUserData = (field: string, value: string) => {
    setUserData(prev => ({ ...prev, [field]: value }));
    // Limpar erro quando usuário começar a digitar
    if (userDataErrors[field as keyof typeof userDataErrors]) {
      setUserDataErrors(prev => ({ ...prev, [field]: '' }));
    }
  };


  const updateAddressField = (field: string, value: string) => {
    setNewAddress(prev => ({ ...prev, [field]: value }));
    // Limpar erro quando usuário começar a digitar
    if (addressErrors[field as keyof typeof addressErrors]) {
      setAddressErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validar formulário de endereço ao adicionar
  const validateAddressForm = () => {
    const errors = {
      nome: '',
      rua: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      cep: '',
    };

    if (!newAddress.nome.trim()) {
      errors.nome = 'Nome do endereço é obrigatório';
    }

    if (!newAddress.rua.trim()) {
      errors.rua = 'Rua é obrigatória';
    }

    if (!newAddress.numero.trim()) {
      errors.numero = 'Número é obrigatório';
    }

    if (!newAddress.cidade.trim()) {
      errors.cidade = 'Cidade é obrigatória';
    }

    if (!newAddress.bairro.trim()) {
      errors.bairro = 'Freguesia é obrigatória';
    }

    if (!newAddress.cep.trim()) {
      errors.cep = 'Código Postal é obrigatório';
    }

    setAddressErrors(errors);
    return !errors.nome && !errors.rua && !errors.numero && !errors.cidade && !errors.bairro && !errors.cep;
  };

  const handleAddAddress = async () => {
    if (!validateAddressForm()) {
      return;
    }

    try {
      console.log('🔄 Iniciando salvamento do endereço...');
      
      // Preparar dados do endereço para envio
      const addressData = {
        id: `addr_${Date.now()}`,
        nome: newAddress.nome,
        rua: newAddress.rua,
        numero: newAddress.numero,
        complemento: newAddress.complemento,
        bairro: newAddress.bairro,
        cidade: newAddress.cidade,
        cep: newAddress.cep,
        latitude: newAddress.latitude,
        longitude: newAddress.longitude,
        referencia: newAddress.latitude && newAddress.longitude 
          ? `Coordenadas: ${newAddress.latitude.toFixed(6)}, ${newAddress.longitude.toFixed(6)}`
          : undefined,
      };

      console.log('📝 Dados do endereço preparados:', addressData);
      console.log('📍 Coordenadas:', { 
        latitude: addressData.latitude, 
        longitude: addressData.longitude 
      });

      // Obter token do AsyncStorage
      const token = await AsyncStorage.getItem('@amadelivery_token');
      console.log('🔑 Token obtido:', token ? 'Sim' : 'Não');

      // Adicionar o novo endereço ao array existente
      const currentAddresses = (user as any)?.enderecosSalvos || [];
      console.log('🏠 Endereços atuais:', currentAddresses);
      
      const updatedAddresses = [...currentAddresses, addressData];
      console.log('📋 Endereços atualizados:', updatedAddresses);

      const apiUrl = `${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.229:4000'}/api/users/${user?.id}`;
      console.log('🌐 URL da API:', apiUrl);
      console.log('👤 ID do usuário:', user?.id);

      // Fazer requisição para atualizar o usuário
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          enderecosSalvos: updatedAddresses,
        }),
      });

      console.log('📡 Status da resposta:', response.status);
      console.log('📡 Status OK:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro na resposta:', errorText);
        throw new Error(`Erro ao salvar endereço: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Resultado da API:', result);

      // Atualizar o estado do usuário com os novos endereços
      if (result && result.enderecosSalvos) {
        updateUser({ enderecosSalvos: result.enderecosSalvos });
        console.log('👤 Usuário atualizado com novos endereços');
        
        // Selecionar automaticamente o novo endereço adicionado
        const newAddedAddress = result.enderecosSalvos.find((addr: Address) => addr.id === addressData.id);
        if (newAddedAddress) {
          setSelectedAddress(newAddedAddress);
          console.log('✅ Novo endereço selecionado automaticamente:', newAddedAddress);
        }
      }

      Alert.alert(
        'Endereço Adicionado!',
        `Endereço "${newAddress.nome}" foi adicionado e selecionado com sucesso.`,
        [
          {
            text: 'OK',
            onPress: async () => {
              setIsAddAddressModalVisible(false);
              setNewAddress({
                nome: '',
                rua: '',
                numero: '',
                complemento: '',
                bairro: '',
                cidade: '',
                cep: '',
                latitude: null,
                longitude: null,
              });
              setAddressErrors({
                nome: '',
                rua: '',
                numero: '',
                complemento: '',
                bairro: '',
                cidade: '',
                cep: '',
              });
              
              // Atualizar lista de endereços local
              setUserAddresses(result.enderecosSalvos || []);
            },
          },
        ]
      );

    } catch (error) {
      console.error('Erro ao salvar endereço:', error);
      Alert.alert(
        'Erro',
        'Não foi possível salvar o endereço. Tente novamente.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleCancelAddAddress = () => {
    setIsAddAddressModalVisible(false);
    setNewAddress({
      nome: '',
      rua: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      cep: '',
      latitude: null,
      longitude: null,
    });
    setAddressErrors({
      nome: '',
      rua: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      cep: '',
    });
    setIsGettingLocation(false);
    setShowCoordinatesObtained(false);
    setIsMapOpen(false);
  };

  // Função para obter localização atual (geolocalização real)
  const getCurrentLocation = async () => {
    setIsGettingLocation(true);

    try {
      // Solicitar permissão de localização
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permissão Negada',
          'É necessário permitir o acesso à localização para usar esta funcionalidade.',
          [{ text: 'OK' }]
        );
        setIsGettingLocation(false);
        return;
      }

      // Obter localização atual
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const latitude = location.coords.latitude;
      const longitude = location.coords.longitude;
      
      setNewAddress(prev => ({
        ...prev,
        latitude,
        longitude,
      }));

      setSelectedLocation({
        latitude,
        longitude,
      });

      setShowCoordinatesObtained(true);
      
      // Esconder o indicador após 3 segundos
      setTimeout(() => {
        setShowCoordinatesObtained(false);
      }, 3000);

    } catch (error) {
      console.error('Erro ao obter localização:', error);
      Alert.alert(
        'Erro',
        'Não foi possível obter sua localização atual. Use o mapa para selecionar uma localização.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Função para abrir o mapa
  const handleOpenMap = async () => {
    // Se já existe latitude e longitude no formulário, usa essas
    if (newAddress.latitude && newAddress.longitude) {
      setSelectedLocation({
        latitude: newAddress.latitude,
        longitude: newAddress.longitude,
      });
    } else {
      // Tentar obter localização real do dispositivo
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          
          setSelectedLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        } else {
          // Usar coordenadas padrão se não tiver permissão
          setSelectedLocation({
            latitude: 41.2704,
            longitude: -8.0818,
          });
        }
      } catch (error) {
        console.error('Erro ao obter localização para o mapa:', error);
        // Usar coordenadas padrão em caso de erro
        setSelectedLocation({
          latitude: 41.2704,
          longitude: -8.0818,
        });
      }
    }
    
    setIsMapOpen(true);
  };

  // Função para lidar com seleção no mapa
  const handleLocationSelect = (locationData: { latitude: number; longitude: number }) => {
    setSelectedLocation(locationData);
    setNewAddress(prev => ({
      ...prev,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
    }));
    setShowCoordinatesObtained(true);
    setIsMapOpen(false);
    
    // Esconder o indicador após 3 segundos
    setTimeout(() => {
      setShowCoordinatesObtained(false);
    }, 3000);
  };

  // Função para gerar HTML do mapa
  const generateMapHTML = (latitude: number, longitude: number, interactive: boolean = false) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body, html {
            margin: 0;
            padding: 0;
            height: 100%;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          #map {
            height: ${interactive ? '100%' : '250px'};
            width: 100%;
            border-radius: ${interactive ? '0' : '8px'};
            position: relative;
          }
          .loading {
            height: 250px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f5f5f5;
            color: #666;
            font-size: 16px;
            border-radius: 8px;
          }
        </style>
      </head>
      <body>
        <div id="map">
          <div class="loading">Carregando mapa...</div>
        </div>
        <script>
          console.log('Iniciando mapa com coordenadas:', ${latitude}, ${longitude});
          
          try {
            const map = L.map('map', {
              zoomControl: ${interactive},
              dragging: ${interactive},
              touchZoom: ${interactive},
              doubleClickZoom: ${interactive},
              scrollWheelZoom: ${interactive},
              boxZoom: ${interactive},
              keyboard: ${interactive},
            }).setView([${latitude}, ${longitude}], ${interactive ? '17' : '17'});
            
            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
              attribution: ''
            }).addTo(map);
            
            const marker = L.marker([${latitude}, ${longitude}], {
              icon: L.divIcon({
                className: 'custom-marker',
                html: '<div style="font-size: 40px;">📍</div>',
                iconSize: [40, 40],
                iconAnchor: [20, 40],
                popupAnchor: [0, -40]
              }),
              draggable: ${interactive}
            }).addTo(map);
            
            ${interactive ? `
            map.on('click', function(e) {
              const { lat, lng } = e.latlng;
              marker.setLatLng([lat, lng]);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'locationSelected',
                latitude: lat,
                longitude: lng
              }));
            });
            
            marker.on('dragend', function() {
              const latlng = marker.getLatLng();
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'locationSelected',
                latitude: latlng.lat,
                longitude: latlng.lng
              }));
            });
            ` : '// Mapa apenas para visualização - sem interação'}
            
            console.log('Mapa carregado com sucesso');
          } catch (error) {
            console.error('Erro ao carregar mapa:', error);
            document.getElementById('map').innerHTML = '<div class="loading">Erro ao carregar mapa</div>';
          }
        </script>
      </body>
      </html>
    `;
  };

  // Se não estiver logado, mostrar tela de login
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={styles.emptyState}>
          <MaterialIcons name="lock" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Login Necessário</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Você precisa fazer login para finalizar o pedido
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/login?redirectTo=/checkout')}
          >
            <Text style={styles.loginButtonText}>Fazer Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Se o carrinho estiver vazio
  if (isCartEmpty || !restaurant) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={styles.emptyState}>
          <MaterialIcons name="shopping-cart" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Carrinho Vazio</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Adicione itens do cardápio para continuar com o pedido
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleNextStep = () => {
    // Validar dados do usuário antes de prosseguir
    if (currentStep === 'user-data') {
      if (!validateUserData()) {
        return;
      }
      
      // Garantir que os dados foram salvos no user
      if (user) {
        const needsUpdate = 
          !user.telefone || 
          user.telefone !== userData.phone ||
          !user.fullName || 
          user.fullName !== userData.fullName;
          
        if (needsUpdate) {
          // Salvar dados atualizados no perfil do usuário
          updateUser({
            telefone: userData.phone,
            fullName: userData.fullName,
            email: userData.email,
          });
        }
      }
    }
    
    // Validar endereço antes de ir para pagamento
    if (currentStep === 'addresses') {
      if (!validateAddress()) {
        return;
      }
    }

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].key as CheckoutStep);
    }
  };

  const handlePrevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].key as CheckoutStep);
    }
  };

  const handlePlaceOrder = () => {
    const serviceFee = subtotal * 0.03; // Taxa de serviço de 3%
    const finalTotal = subtotal + deliveryFee + serviceFee;
    
    Alert.alert(
      'Pedido Confirmado! 🎉',
      `Seu pedido foi realizado com sucesso!\n\nRestaurante: ${restaurant.nome}\nTotal: €${finalTotal.toFixed(2)}`,
      [
        {
          text: 'OK',
          onPress: () => router.replace('/'),
        },
      ]
    );
  };

  const renderProgressIndicator = useCallback(() => (
    <View style={[styles.progressContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      {steps.map((step, index) => {
        const isActive = index <= currentStepIndex;
        return (
          <View key={step.key} style={styles.progressStep}>
            <View style={[
              styles.progressCircle,
              isActive && styles.progressCircleActive,
              !isActive && { backgroundColor: colors.surface, borderColor: colors.border }
            ]}>
              <MaterialIcons
                name={step.icon as any}
                size={16}
                color={isActive ? 'white' : colors.textSecondary}
              />
            </View>
            <Text style={[
              styles.progressText,
              !isActive && { color: colors.textSecondary },
              isActive && { color: colors.primary }
            ]}>
              {step.title}
            </Text>
            {index < steps.length - 1 && (
              <View style={[
                styles.progressLine,
                !isActive && { backgroundColor: colors.border },
                index < currentStepIndex && { backgroundColor: colors.primary }
              ]} />
            )}
          </View>
        );
      })}
    </View>
  ), [currentStepIndex, colors]);

  const renderStepContent = useCallback(() => {
    switch (currentStep) {
      case 'user-data':
        return (
          <View style={styles.stepContent}>
            {/* Welcome Section */}
            <View style={styles.welcomeSection}>
              <Text style={[styles.welcomeTitle, { color: colors.text }]}>Seus dados</Text>
              <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>Confirme suas informações pessoais</Text>
            </View>

            {/* Form Fields */}
            <View style={styles.fieldsContainer}>
              {/* Full Name Input */}
              <View style={styles.inputGroup}>
                <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <MaterialIcons name="person" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.textInput, { color: colors.text }]}
                    placeholder="Nome completo"
                    placeholderTextColor={colors.textSecondary}
                    value={userData.fullName}
                    onChangeText={(value) => updateUserData('fullName', value)}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
                {userDataErrors.fullName ? (
                  <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={16} color={colors.error} />
                    <Text style={[styles.errorText, { color: colors.error }]}>{userDataErrors.fullName}</Text>
                  </View>
                ) : null}
              </View>

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <MaterialIcons name="email" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.textInput, { color: colors.text }]}
                    placeholder="Email"
                    placeholderTextColor={colors.textSecondary}
                    value={userData.email}
                    onChangeText={(value) => updateUserData('email', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                {userDataErrors.email ? (
                  <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={16} color={colors.error} />
                    <Text style={[styles.errorText, { color: colors.error }]}>{userDataErrors.email}</Text>
                  </View>
                ) : null}
              </View>

              {/* Phone Input */}
              <View style={styles.inputGroup}>
                <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <MaterialIcons name="phone" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.textInput, { color: colors.text }]}
                    placeholder="Telefone"
                    placeholderTextColor={colors.textSecondary}
                    value={userData.phone}
                    onChangeText={(value) => updateUserData('phone', value)}
                    keyboardType="phone-pad"
                    autoCorrect={false}
                  />
                </View>
                {userDataErrors.phone ? (
                  <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={16} color={colors.error} />
                    <Text style={[styles.errorText, { color: colors.error }]}>{userDataErrors.phone}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        );

      case 'addresses':
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Endereços salvos</Text>
            
            <ScrollView 
              style={styles.addressesScrollView}
              contentContainerStyle={styles.addressesScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {isLoadingAddresses ? (
                <View style={styles.loadingContainer}>
                  <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Carregando endereços...</Text>
                </View>
              ) : userAddresses.length > 0 ? (
                <View style={styles.addressesList}>
                  {userAddresses.map((address) => (
                    <TouchableOpacity
                      key={address.id}
                      style={[
                        styles.addressOption,
                        selectedAddress?.id === address.id && styles.addressOptionSelected,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                        selectedAddress?.id === address.id && { borderColor: colors.primary }
                      ]}
                      onPress={() => setSelectedAddress(address)}
                    >
                      <MaterialIcons 
                        name={address.nome.toLowerCase().includes('casa') ? 'home' : 
                              address.nome.toLowerCase().includes('trabalho') ? 'work' : 'place'} 
                        size={24} 
                        color={colors.primary} 
                      />
                      <View style={styles.addressInfo}>
                        <Text style={[styles.addressTitle, { color: colors.text }]}>{address.nome}</Text>
                        <Text style={[styles.addressText, { color: colors.textSecondary }]}>
                          {address.rua}, {address.numero}
                          {address.complemento && ` - ${address.complemento}`}
                        </Text>
                        <Text style={[styles.addressCity, { color: colors.textSecondary }]}>
                          {address.bairro}, {address.cidade}
                        </Text>
                      </View>
                      <MaterialIcons
                        name={selectedAddress?.id === address.id ? 'radio-button-checked' : 'radio-button-unchecked'}
                        size={24}
                        color={selectedAddress?.id === address.id ? colors.primary : colors.textSecondary}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyAddressesContainer}>
                  <MaterialIcons name="place" size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyAddressesTitle, { color: colors.text }]}>Nenhum endereço salvo</Text>
                  <Text style={[styles.emptyAddressesText, { color: colors.textSecondary }]}>
                    Você precisa adicionar um endereço para continuar com o pedido
                  </Text>
                </View>
              )}
              
              {/* Mostrar mensagem se nenhum endereço está selecionado */}
              {!selectedAddress && userAddresses.length > 0 && (
                <View style={[styles.warningContainer, { backgroundColor: colors.surface, borderLeftColor: colors.warning }]}>
                  <MaterialIcons name="info" size={20} color={colors.warning} />
                  <Text style={[styles.warningText, { color: colors.text }]}>
                    Selecione um endereço ou adicione um novo para continuar
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        );

      case 'payment':
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Forma de pagamento</Text>
            
            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === 'cash' && styles.paymentOptionSelected,
                { backgroundColor: colors.surface, borderColor: colors.border },
                paymentMethod === 'cash' && { borderColor: colors.primary }
              ]}
              onPress={() => setPaymentMethod('cash')}
            >
              <MaterialIcons name="money" size={24} color={colors.primary} />
              <Text style={[styles.paymentText, { color: colors.text }]}>Dinheiro</Text>
              <MaterialIcons
                name={paymentMethod === 'cash' ? 'radio-button-checked' : 'radio-button-unchecked'}
                size={24}
                color={paymentMethod === 'cash' ? colors.primary : colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === 'card' && styles.paymentOptionSelected,
                { backgroundColor: colors.surface, borderColor: colors.border },
                paymentMethod === 'card' && { borderColor: colors.primary }
              ]}
              onPress={() => setPaymentMethod('card')}
            >
              <MaterialIcons name="credit-card" size={24} color={colors.primary} />
              <Text style={[styles.paymentText, { color: colors.text }]}>Cartão</Text>
              <MaterialIcons
                name={paymentMethod === 'card' ? 'radio-button-checked' : 'radio-button-unchecked'}
                size={24}
                color={paymentMethod === 'card' ? colors.primary : colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        );

      case 'review':
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Revisar pedido</Text>
            
            {/* Dados do Cliente e Endereço */}
            <View style={styles.reviewSection}>
              <Text style={[styles.reviewSectionTitle, { color: colors.text }]}>Dados do Cliente e Endereço</Text>
              <View style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {/* Dados do Usuário */}
                <Text style={[styles.reviewText, { color: colors.text }]}>Nome: {userData.fullName}</Text>
                <Text style={[styles.reviewText, { color: colors.text }]}>Email: {userData.email}</Text>
                <Text style={[styles.reviewText, { color: colors.text }]}>Telefone: {userData.phone}</Text>
                
                {/* Divisor */}
                <View style={[styles.reviewDivider, { backgroundColor: colors.border }]} />
                
                {/* Endereço */}
                {selectedAddress ? (
                  <>
                    <Text style={[styles.reviewText, { color: colors.text }]}>{selectedAddress.nome}</Text>
                    <Text style={[styles.reviewText, { color: colors.text }]}>
                      {selectedAddress.rua}, {selectedAddress.numero}
                      {selectedAddress.complemento && ` - ${selectedAddress.complemento}`}
                    </Text>
                    <Text style={[styles.reviewText, { color: colors.text }]}>
                      {selectedAddress.bairro}, {selectedAddress.cidade}
                    </Text>
                    {selectedAddress.cep && (
                      <Text style={[styles.reviewText, { color: colors.text }]}>CEP: {selectedAddress.cep}</Text>
                    )}
                  </>
                ) : (
                  <Text style={[styles.reviewText, { color: colors.text }]}>Nenhum endereço selecionado</Text>
                )}
              </View>
            </View>

            {/* Resumo do Pedido */}
            <View style={styles.reviewSection}>
              <Text style={[styles.reviewSectionTitle, { color: colors.text }]}>Resumo do Pedido</Text>
              
              {/* Nome do Restaurante */}
              <View style={[styles.restaurantCard, styles.restaurantCardInReview, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <MaterialIcons name="restaurant" size={24} color={colors.primary} />
                <View style={styles.restaurantInfo}>
                  <View style={styles.restaurantNameRow}>
                    <Text style={[styles.restaurantName, { color: colors.text }]}>{restaurant.nome}</Text>
                    <Text style={[styles.itemCount, { color: colors.textSecondary }]}>{`${items.length} ${items.length === 1 ? 'item' : 'itens'}`}</Text>
                  </View>
                </View>
              </View>
              
              {(() => {
                const serviceFee = subtotal * 0.03; // Taxa de serviço de 3%
                const finalTotal = subtotal + deliveryFee + serviceFee;
                
                return (
                  <>
              <View style={styles.reviewItemsList}>
                {items.map((item) => {
                  // Calcular preço unitário base (sem extras e customizações)
                  const baseUnitPrice = item.menuItem.preco;
                  
                  return (
                    <View key={item.id} style={[styles.reviewCartItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      {/* Nome do item com preço unitário à direita */}
                      <View style={styles.reviewItemHeader}>
                        <Text style={[styles.reviewItemName, { color: colors.text }]}>{`${item.quantity} x ${item.menuItem.nome}`}</Text>
                        <Text style={[styles.reviewItemPrice, { color: colors.primary }]}>{`€${baseUnitPrice.toFixed(2)}`}</Text>
                      </View>

                      {/* Modificações com preços à direita */}
                      <View style={styles.reviewModificationsContainer}>
                        {item.customizations && Object.keys(item.customizations).length > 0 && (
                          <>
                            {Object.entries(item.customizations).map(([groupName, selection], idx) => {
                              let optionName = '';
                              let additionalPrice = 0;
                              
                              if (typeof selection === 'object' && selection !== null && !Array.isArray(selection)) {
                                optionName = (selection as any).nome || '';
                                additionalPrice = (selection as any).preco_adicional || 0;
                              } else if (Array.isArray(selection) && selection.length > 0) {
                                optionName = selection[0];
                              } else if (typeof selection === 'string') {
                                optionName = selection;
                              }
                              
                              // Verificar se é grupo de tamanho/porção (considerando variações)
                              const groupNameLower = groupName.toLowerCase();
                              const isSizeGroup = groupNameLower.includes('tamanho') || 
                                                groupNameLower.includes('porção') ||
                                                groupNameLower.includes('porcao') ||
                                                groupNameLower.includes('porçao') ||
                                                groupNameLower.includes('size') ||
                                                groupNameLower.includes('portion');
                              
                              // Se for grupo de tamanho/porção, mostrar com título
                              if (isSizeGroup && optionName) {
                                // Para porções/tamanhos, buscar o preço do grupo se não tiver em additionalPrice
                                if (additionalPrice === 0) {
                                  const group = item.menuItem.opcoes_personalizacao?.find(g => {
                                    const normalized = g.nome_grupo
                                      .replace(/^_/, '')
                                      .replace(/_/g, ' ')
                                      .replace(/\b\w/g, l => l.toUpperCase());
                                    return normalized.toLowerCase() === groupNameLower || 
                                           g.nome_grupo.toLowerCase() === groupNameLower;
                                  });
                                  const option = group?.opcoes.find(o => o.nome === optionName);
                                  additionalPrice = option?.preco_adicional || 0;
                                }
                                
                                // Mostrar apenas uma vez com o título do grupo
                                return (
                                  <View key={`size-${idx}`} style={styles.reviewModificationRow}>
                                    <Text style={[styles.reviewModificationText, { color: colors.text }]}>
                                      {`• ${groupName}: ${optionName}`}
                                    </Text>
                                    {additionalPrice > 0 && (
                                      <Text style={[styles.reviewModificationPrice, { color: colors.primary }]}>
                                        {`+€${additionalPrice.toFixed(2)}`}
                                      </Text>
                                    )}
                                  </View>
                                );
                              }
                              
                              // Se não for grupo de tamanho/porção, será processado abaixo
                              return null;
                            })}

                            {/* Outras customizações (sem título, apenas o nome da opção) */}
                            {Object.entries(item.customizations).map(([groupName, selection], idx) => {
                              // Verificar se é grupo de tamanho/porção - já foi mostrado acima
                              const groupNameLower = groupName.toLowerCase();
                              const isSizeGroup = groupNameLower.includes('tamanho') || 
                                                groupNameLower.includes('porção') ||
                                                groupNameLower.includes('porcao') ||
                                                groupNameLower.includes('porçao') ||
                                                groupNameLower.includes('size') ||
                                                groupNameLower.includes('portion');
                              
                              // Pular grupos de tamanho/porção pois já foram mostrados acima
                              if (isSizeGroup) return null;
                              
                              let options: Array<{nome: string, preco?: number}> = [];
                              if (typeof selection === 'object' && selection !== null && !Array.isArray(selection)) {
                                options = [{
                                  nome: (selection as any).nome || '',
                                  preco: (selection as any).preco_adicional || 0
                                }];
                              } else if (Array.isArray(selection)) {
                                const group = item.menuItem.opcoes_personalizacao?.find(g => 
                                  g.nome_grupo.toLowerCase() === groupName.toLowerCase()
                                );
                                options = selection.map(optName => {
                                  const option = group?.opcoes.find(o => o.nome === optName);
                                  return {
                                    nome: optName,
                                    preco: option?.preco_adicional || 0
                                  };
                                });
                              } else if (typeof selection === 'string') {
                                const group = item.menuItem.opcoes_personalizacao?.find(g => 
                                  g.nome_grupo.toLowerCase() === groupName.toLowerCase()
                                );
                                const option = group?.opcoes.find(o => o.nome === selection);
                                options = [{
                                  nome: selection,
                                  preco: option?.preco_adicional || 0
                                }];
                              }
                              
                              // Mostrar apenas o nome da opção, sem o título do grupo
                              return options.map((option, optIdx) => (
                                <View key={`${idx}-${optIdx}`} style={styles.reviewModificationRow}>
                                  <Text style={[styles.reviewModificationText, { color: colors.text }]}>
                                    {`+ ${option.nome}`}
                                  </Text>
                                  {option.preco > 0 && (
                                    <Text style={[styles.reviewModificationPrice, { color: colors.primary }]}>
                                      {`€${option.preco.toFixed(2)}`}
                                    </Text>
                                  )}
                                </View>
                              ));
                            })}
                          </>
                        )}

                        {/* Extras */}
                        {item.selectedExtras && item.selectedExtras.length > 0 && (
                          <>
                            {item.selectedExtras.map((extra, index) => {
                              const quantidade = (extra as any).quantidade || 1;
                              const totalExtra = extra.preco * quantidade;
                              return (
                                <View key={index} style={styles.reviewModificationRow}>
                                  <Text style={[styles.reviewModificationText, { color: colors.text }]}>
                                    {`+ ${quantidade}x ${extra.nome}`}
                                  </Text>
                                  <Text style={[styles.reviewModificationPrice, { color: colors.primary }]}>
                                    {`€${totalExtra.toFixed(2)}`}
                                  </Text>
                                </View>
                              );
                            })}
                          </>
                        )}

                        {/* Ingredientes removidos (em vermelho, sem preço) */}
                        {item.removedIngredients && item.removedIngredients.length > 0 && (
                          <>
                            {item.removedIngredients.map((ingredient, index) => (
                              <View key={index} style={styles.reviewModificationRow}>
                                <Text style={[styles.reviewRemovedIngredient, { color: colors.error }]}>
                                  {`- Sem ${ingredient}`}
                                </Text>
                              </View>
                            ))}
                          </>
                        )}

                        {/* Observações */}
                        {item.observations && (
                          <View style={styles.reviewModificationRow}>
                            <Text style={[styles.reviewObservationsText, { color: colors.textSecondary }]}>
                              {`💬 "${item.observations}"`}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Total do Item */}
                      <View style={[styles.reviewQuantityWrapper, { borderTopColor: colors.border }]}>
                        <Text style={[styles.reviewItemTotalPrice, { color: colors.primary }]}>
                          {`Total: €${item.totalPrice.toFixed(2)}`}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Total */}
              <View style={[styles.reviewTotalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.reviewTotalRow}>
                  <Text style={[styles.reviewTotalLabel, { color: colors.text }]}>Subtotal</Text>
                  <Text style={[styles.reviewTotalValue, { color: colors.text }]}>{`€${subtotal.toFixed(2)}`}</Text>
                </View>
                <View style={styles.reviewTotalRow}>
                  <Text style={[styles.reviewTotalLabel, { color: colors.text }]}>Taxa de Entrega</Text>
                  <Text style={[styles.reviewTotalValue, { color: colors.text }]}>{`€${deliveryFee.toFixed(2)}`}</Text>
                </View>
                <View style={styles.reviewTotalRow}>
                  <Text style={[styles.reviewTotalLabel, { color: colors.text }]}>Taxa de Serviço (3%)</Text>
                  <Text style={[styles.reviewTotalValue, { color: colors.text }]}>{`€${serviceFee.toFixed(2)}`}</Text>
                </View>
                <View style={[styles.reviewTotalRow, styles.reviewTotalFinalRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.reviewTotalFinalLabel, { color: colors.text }]}>Total do Pedido</Text>
                  <Text style={[styles.reviewTotalFinalValue, { color: colors.primary }]}>{`€${finalTotal.toFixed(2)}`}</Text>
                </View>
              </View>
                  </>
                );
              })()}
            </View>
          </View>
        );

      default:
        return null;
    }
  }, [currentStep, userData, userDataErrors, updateUserData, isAuthenticated, isLoadingAddresses, userAddresses, selectedAddress, paymentMethod, restaurant, items, total, colors]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: colors.background, borderWidth: 0 }]} 
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Finalizar Pedido</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Progress Indicator */}
      {renderProgressIndicator()}

      {/* Step Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStepContent()}
      </ScrollView>

      {/* Add Address Button - Above Navigation (only on addresses step) */}
      {currentStep === 'addresses' && (
        <View style={[styles.addAddressContainer, { backgroundColor: colors.background }]}>
          <TouchableOpacity 
            style={styles.addAddressButton}
            onPress={() => setIsAddAddressModalVisible(true)}
          >
            <MaterialIcons name="add" size={20} color="white" />
            <Text style={styles.addAddressText}>Adicionar Morada</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Navigation Buttons */}
      <View style={[styles.navigationContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        {currentStepIndex > 0 ? (
          <TouchableOpacity 
            style={[styles.prevButton, { borderColor: colors.border }]} 
            onPress={handlePrevStep}
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.text} />
            <Text style={[styles.prevButtonText, { color: colors.text }]}>Voltar</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.prevButtonPlaceholder} />
        )}
        
        <TouchableOpacity
          style={styles.nextButton}
          onPress={currentStep === 'payment' ? handlePlaceOrder : handleNextStep}
        >
          <Text style={styles.nextButtonText}>
            {currentStep === 'payment' ? 'Finalizar Pedido' : 'Continuar'}
          </Text>
          <MaterialIcons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Modal de Adicionar Endereço */}
      <Modal 
        visible={isAddAddressModalVisible} 
        animationType="slide" 
        presentationStyle="pageSheet"
        onRequestClose={handleCancelAddAddress}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
          {/* Header do Modal */}
          <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <TouchableOpacity 
              style={[styles.modalBackButton, { backgroundColor: colors.background, borderWidth: 0 }]}
              onPress={handleCancelAddAddress}
            >
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Adicionar Endereço</Text>
            <View style={styles.modalHeaderSpacer} />
          </View>
      
      <ScrollView 
            style={styles.modalContent} 
            contentContainerStyle={styles.modalContentContainer}
        showsVerticalScrollIndicator={false}
          >
            <View style={styles.fieldsContainer}>
              {/* Nome do Endereço */}
              <View style={styles.inputGroup}>
                <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <MaterialIcons name="home" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.textInput, { color: colors.text }]}
                    placeholder="Nome (ex: Casa, Trabalho)"
                    placeholderTextColor={colors.textSecondary}
                    value={newAddress.nome}
                    onChangeText={(value) => updateAddressField('nome', value)}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
                {addressErrors.nome ? (
                  <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={16} color={colors.error} />
                    <Text style={[styles.errorText, { color: colors.error }]}>{addressErrors.nome}</Text>
                  </View>
                ) : null}
              </View>

              {/* Rua */}
              <View style={styles.inputGroup}>
                <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <MaterialIcons name="place" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.textInput, { color: colors.text }]}
                    placeholder="Nome da rua"
                    placeholderTextColor={colors.textSecondary}
                    value={newAddress.rua}
                    onChangeText={(value) => updateAddressField('rua', value)}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
                {addressErrors.rua ? (
                  <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={16} color={colors.error} />
                    <Text style={[styles.errorText, { color: colors.error }]}>{addressErrors.rua}</Text>
                  </View>
                ) : null}
              </View>

              {/* Complemento */}
              <View style={styles.inputGroup}>
                <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <MaterialIcons name="apartment" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.textInput, { color: colors.text }]}
                    placeholder="Complemento: 3 Frente (opcional)"
                    placeholderTextColor={colors.textSecondary}
                    value={newAddress.complemento}
                    onChangeText={(value) => updateAddressField('complemento', value)}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
                {addressErrors.complemento ? (
                  <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={16} color={colors.error} />
                    <Text style={[styles.errorText, { color: colors.error }]}>{addressErrors.complemento}</Text>
                  </View>
                ) : null}
              </View>

              {isTablet ? (
                /* Em tablets: Número e CEP lado a lado */
                <View style={styles.rowContainer}>
                  <View style={styles.numeroInputGroup}>
                    <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <MaterialIcons name="looks-one" size={20} color={colors.textSecondary} />
                      <TextInput
                        style={[styles.textInput, { color: colors.text }]}
                        placeholder="Número"
                        placeholderTextColor={colors.textSecondary}
                        value={newAddress.numero}
                        onChangeText={(value) => updateAddressField('numero', value)}
                        keyboardType="numeric"
                        autoCorrect={false}
                      />
                    </View>
                    {addressErrors.numero ? (
                      <View style={styles.errorContainer}>
                        <MaterialIcons name="error-outline" size={16} color={colors.error} />
                        <Text style={[styles.errorText, { color: colors.error }]}>{addressErrors.numero}</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.cepInputGroup}>
                    <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <MaterialIcons name="markunread-mailbox" size={20} color={colors.textSecondary} />
                      <TextInput
                        style={[styles.textInput, { color: colors.text }]}
                        placeholder="Código Postal"
                        placeholderTextColor={colors.textSecondary}
                        value={newAddress.cep}
                        onChangeText={(value) => updateAddressField('cep', value)}
                        keyboardType="numeric"
                        autoCorrect={false}
                      />
                    </View>
                    {addressErrors.cep ? (
                      <View style={styles.errorContainer}>
                        <MaterialIcons name="error-outline" size={16} color={colors.error} />
                        <Text style={[styles.errorText, { color: colors.error }]}>{addressErrors.cep}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              ) : (
                /* Em celulares: Número e CEP em linhas separadas */
                <>
                  <View style={styles.inputGroup}>
                    <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <MaterialIcons name="looks-one" size={20} color={colors.textSecondary} />
                      <TextInput
                        style={[styles.textInput, { color: colors.text }]}
                        placeholder="Número"
                        placeholderTextColor={colors.textSecondary}
                        value={newAddress.numero}
                        onChangeText={(value) => updateAddressField('numero', value)}
                        keyboardType="numeric"
                        autoCorrect={false}
                      />
                    </View>
                    {addressErrors.numero ? (
                      <View style={styles.errorContainer}>
                        <MaterialIcons name="error-outline" size={16} color={colors.error} />
                        <Text style={[styles.errorText, { color: colors.error }]}>{addressErrors.numero}</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <MaterialIcons name="markunread-mailbox" size={20} color={colors.textSecondary} />
                      <TextInput
                        style={[styles.textInput, { color: colors.text }]}
                        placeholder="Código Postal"
                        placeholderTextColor={colors.textSecondary}
                        value={newAddress.cep}
                        onChangeText={(value) => updateAddressField('cep', value)}
                        keyboardType="numeric"
                        autoCorrect={false}
        />
      </View>
                    {addressErrors.cep ? (
                      <View style={styles.errorContainer}>
                        <MaterialIcons name="error-outline" size={16} color={colors.error} />
                        <Text style={[styles.errorText, { color: colors.error }]}>{addressErrors.cep}</Text>
    </View>
                    ) : null}
                  </View>
                </>
              )}

              {isTablet ? (
                /* Em tablets: Freguesia e Cidade lado a lado */
                <View style={styles.rowContainer}>
                  <View style={styles.halfInputGroup}>
                    <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <MaterialIcons name="location-city" size={20} color={colors.textSecondary} />
                      <TextInput
                        style={[styles.textInput, { color: colors.text }]}
                        placeholder="Freguesia"
                        placeholderTextColor={colors.textSecondary}
                        value={newAddress.bairro}
                        onChangeText={(value) => updateAddressField('bairro', value)}
                        autoCapitalize="words"
                        autoCorrect={false}
                      />
                    </View>
                    {addressErrors.bairro ? (
                      <View style={styles.errorContainer}>
                        <MaterialIcons name="error-outline" size={16} color={colors.error} />
                        <Text style={[styles.errorText, { color: colors.error }]}>{addressErrors.bairro}</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.halfInputGroup}>
                    <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <MaterialIcons name="location-city" size={20} color={colors.textSecondary} />
                      <TextInput
                        style={[styles.textInput, { color: colors.text }]}
                        placeholder="Cidade"
                        placeholderTextColor={colors.textSecondary}
                        value={newAddress.cidade}
                        onChangeText={(value) => updateAddressField('cidade', value)}
                        autoCapitalize="words"
                        autoCorrect={false}
                      />
                    </View>
                    {addressErrors.cidade ? (
                      <View style={styles.errorContainer}>
                        <MaterialIcons name="error-outline" size={16} color={colors.error} />
                        <Text style={[styles.errorText, { color: colors.error }]}>{addressErrors.cidade}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              ) : (
                /* Em celulares: Freguesia e Cidade em linhas separadas */
                <>
                  <View style={styles.inputGroup}>
                    <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <MaterialIcons name="location-city" size={20} color={colors.textSecondary} />
                      <TextInput
                        style={[styles.textInput, { color: colors.text }]}
                        placeholder="Freguesia"
                        placeholderTextColor={colors.textSecondary}
                        value={newAddress.bairro}
                        onChangeText={(value) => updateAddressField('bairro', value)}
                        autoCapitalize="words"
                        autoCorrect={false}
                      />
                    </View>
                    {addressErrors.bairro ? (
                      <View style={styles.errorContainer}>
                        <MaterialIcons name="error-outline" size={16} color={colors.error} />
                        <Text style={[styles.errorText, { color: colors.error }]}>{addressErrors.bairro}</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <MaterialIcons name="location-city" size={20} color={colors.textSecondary} />
                      <TextInput
                        style={[styles.textInput, { color: colors.text }]}
                        placeholder="Cidade"
                        placeholderTextColor={colors.textSecondary}
                        value={newAddress.cidade}
                        onChangeText={(value) => updateAddressField('cidade', value)}
                        autoCapitalize="words"
                        autoCorrect={false}
                      />
                    </View>
                    {addressErrors.cidade ? (
                      <View style={styles.errorContainer}>
                        <MaterialIcons name="error-outline" size={16} color={colors.error} />
                        <Text style={[styles.errorText, { color: colors.error }]}>{addressErrors.cidade}</Text>
                      </View>
                    ) : null}
                  </View>
                </>
              )}

            </View>

            {/* Seção de Localização no Mapa */}
            <View style={[styles.mapSection, { borderTopColor: colors.border }]}>
              <Text style={[styles.mapSectionTitle, { color: colors.text }]}>Localização no Mapa</Text>
              
              {/* Mensagem de status */}
              {showCoordinatesObtained && (
                <View style={[styles.locationStatusContainer, { backgroundColor: colors.surface }]}>
                  <MaterialIcons name="place" size={16} color={colors.success} />
                  <Text style={[styles.locationStatusText, { color: colors.text }]}>
                    Localização obtida automaticamente
                  </Text>
                </View>
              )}

              {/* Mapa Real */}
              <View style={[styles.mapContainer, { backgroundColor: colors.surface }]}>
                <WebView
                  style={styles.map}
                  source={{ html: generateMapHTML(selectedLocation.latitude, selectedLocation.longitude) }}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  startInLoadingState={true}
                  mixedContentMode="compatibility"
                  allowsInlineMediaPlayback={true}
                  mediaPlaybackRequiresUserAction={false}
                />

              </View>
              
              {/* Descrição do Mapa */}
              <Text style={[styles.mapDescription, { color: colors.textSecondary, backgroundColor: colors.background }]}>
                Esta é a localização exata que será usada para entregas
              </Text>

              {/* Botão para ajustar localização */}
              <View style={styles.mapButtonsContainer}>
                <TouchableOpacity 
                  style={[styles.mapButton, { backgroundColor: colors.surface, borderWidth: 0 }]}
                  onPress={handleOpenMap}
                >
                  <MaterialIcons name="place" size={20} color={colors.primary} />
                  <Text style={[styles.mapButtonText, { color: colors.text }]}>Ajustar Localização</Text>
                </TouchableOpacity>
              </View>
            </View>
      </ScrollView>

          {/* Botões do Modal */}
          <View style={[styles.modalButtons, { borderTopColor: colors.border }]}>
            <TouchableOpacity 
              style={[styles.modalCancelButton, { borderWidth: 0 }]}
              onPress={handleCancelAddAddress}
            >
              <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.modalSaveButton}
              onPress={handleAddAddress}
            >
              <Text style={styles.modalSaveText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Modal do Mapa para Seleção Manual */}
      <Modal
        visible={isMapOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsMapOpen(false)}
      >
        <SafeAreaView style={[styles.mapModalContainer, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
          {/* Header do Modal do Mapa */}
          <View style={[styles.mapModalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <TouchableOpacity 
              style={[styles.mapModalBackButton, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => setIsMapOpen(false)}
            >
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.mapModalTitle, { color: colors.text }]}>Selecionar Localização</Text>
            <View style={styles.mapModalHeaderSpacer} />
          </View>

          {/* Conteúdo do Mapa */}
          <WebView
            style={styles.mapModalContent}
            source={{ html: generateMapHTML(selectedLocation.latitude, selectedLocation.longitude, true) }}
            onMessage={(event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);
                if (data.type === 'locationSelected') {
                  setSelectedLocation({
                    latitude: data.latitude,
                    longitude: data.longitude,
                  });
                }
              } catch (error) {
                console.error('Erro ao processar mensagem do mapa:', error);
              }
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            mixedContentMode="compatibility"
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
          />
          
          {/* Botões de ação */}
          <View style={styles.mapActionButtons}>
              <TouchableOpacity 
                style={styles.mapActionButton}
                onPress={() => {
                  handleLocationSelect(selectedLocation);
                }}
              >
                <MaterialIcons name="place" size={20} color="white" />
                <Text style={styles.mapActionButtonText}>Confirmar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.mapActionButtonSecondary, { borderWidth: 0 }]}
                onPress={() => setIsMapOpen(false)}
              >
                <Text style={styles.mapActionButtonSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSpacer: {
    width: 40,
  },
  // Progress Indicator
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  progressStep: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  progressCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  progressCircleActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  progressText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  progressTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  progressLine: {
    position: 'absolute',
    top: 16,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: COLORS.border,
    zIndex: -1,
  },
  progressLineActive: {
    backgroundColor: COLORS.primary,
  },
  // Content
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  stepContent: {
    flex: 1,
    minHeight: 300,
  },
  stepTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  // Welcome Section (RegisterScreen pattern)
  welcomeSection: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  welcomeTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  welcomeSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  // Form Fields - Espaçamentos aumentados para separação visual
  fieldsContainer: {
    gap: SPACING.smd,
  },
  inputGroup: {
    gap: SPACING.smd,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginLeft: SPACING.sm,
    paddingVertical: 0,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  // Step 1 - Review
  restaurantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  restaurantCardInReview: {
    marginBottom: SPACING.md, // Remove margin quando usado no resumo
  },
  restaurantInfo: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  restaurantNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  restaurantName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  itemCount: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  itemsList: {
    marginBottom: SPACING.lg,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  itemQuantity: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginHorizontal: SPACING.sm,
  },
  itemPrice: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  totalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xs,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  totalLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  totalValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  errorText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    flex: 1,
  },
  // Address Options
  addressesScrollView: {
    maxHeight: 500, // Limitar altura para garantir que o botão fique visível
    marginBottom: SPACING.md,
  },
  addressesScrollContent: {
    paddingBottom: SPACING.sm,
    flexGrow: 1,
  },
  addressesList: {
    marginBottom: SPACING.lg,
  },
  addressOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addressOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#f0f8ff',
  },
  addressInfo: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  addressTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  addressText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  addAddressContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addAddressText: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: 'white',
  },
  // Step 3 - Payment
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  paymentOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#f0f8ff',
  },
  paymentText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: SPACING.md,
    flex: 1,
  },
  // Step 4 - Review
  reviewSection: {
    marginBottom: SPACING.xl,
  },
  reviewSectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  reviewCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm -20,
  },
  reviewText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  reviewDivider: {
    height: 1,
    marginVertical: SPACING.md,
  },
  // Review Items List (same as cart)
  reviewItemsList: {
    marginBottom: SPACING.md,
  },
  reviewCartItem: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reviewItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  reviewItemName: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  reviewItemPrice: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  reviewModificationsContainer: {
    marginBottom: SPACING.md,
  },
  reviewModificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  reviewModificationText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    flex: 1,
  },
  reviewModificationPrice: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  reviewRemovedIngredient: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
  },
  reviewObservationsText: {
    fontSize: FONT_SIZES.sm,
    fontStyle: 'italic',
  },
  reviewQuantityWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  reviewQuantityText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  reviewItemTotalPrice: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  reviewTotalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: -15,
    marginBottom: SPACING.md,
  },
  reviewTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  reviewTotalFinalRow: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginBottom: 0,
  },
  reviewTotalLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  reviewTotalValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  reviewTotalFinalLabel: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  reviewTotalFinalValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  // Navigation
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.sm,
  },
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 80,
  },
  prevButtonPlaceholder: {
    minWidth: 80,
  },
  prevButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: SPACING.xs,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    minWidth: 100,
    shadowColor: COLORS.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  nextButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: 'white',
    marginRight: SPACING.xs,
  },
  // Empty States
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  loginButtonText: {
    color: COLORS.surface,
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  // Modal de Endereço (Tela Cheia)
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: SPACING.md,
  },
  modalHeaderSpacer: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    minHeight: 600,
  },
  modalContentContainer: {
    paddingBottom: SPACING.xxl,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 24,
  },
  halfInputGroup: {
    flex: 1, // Mesmo tamanho para ambos os campos lado a lado
    gap: SPACING.smd,
  },
  numeroInputGroup: {
    flex: 1, // 50% da largura em tablets
    gap: SPACING.smd,
  },
  complementoInputGroup: {
    flex: 1.0, // Campo maior para complemento
    gap: SPACING.smd,
  },
  cepInputGroup: {
    flex: 1, // 50% da largura em tablets
    gap: SPACING.smd,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  modalCancelButton: {
    flex: 1,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.sm,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  modalSaveButton: {
    flex: 1,
    padding: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    marginLeft: SPACING.sm,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: FONT_SIZES.md,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  // Seção do Mapa
  mapSection: {
    marginTop: SPACING.xl,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  mapSectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  mapButtonsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  mapButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  mapButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
  mapButtonTextDisabled: {
    color: COLORS.textSecondary,
  },
  locationStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  locationStatusText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    flex: 1,
  },
  // Modal do Mapa
  mapModalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  mapModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  mapModalBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapModalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: SPACING.md,
  },
  mapModalHeaderSpacer: {
    width: 40,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    backgroundColor: '#ffffff',
    margin: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mapPlaceholderTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  mapPlaceholderText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  mapPlaceholderSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  mapActionButtons: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  mapActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  mapActionButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: 'white',
  },
  mapActionButtonSecondary: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  mapActionButtonSecondaryText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  warningText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.warning,
    flex: 1,
  },
  // Estilos para o mapa real
  mapContainer: {
    marginTop: SPACING.lg,
    marginHorizontal: 0,
    borderRadius: 0,
    overflow: 'visible',
    borderWidth: 0,
    borderColor: COLORS.border,
    backgroundColor: '#ffffff',
    height: 250,
  },
  map: {
    height: 250,
    width: '100%',
    borderRadius: 0,
  },
  mapDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  // Estilos para o modal do mapa
  mapModalContent: {
    flex: 1,
    width: '100%',
    backgroundColor: '#ffffff',
  },
  // Estilos para estados vazios e loading
  loadingContainer: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  emptyAddressesContainer: {
    paddingVertical: SPACING.xxl,
    alignItems: 'center',
  },
  emptyAddressesTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptyAddressesText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  addressCity: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});