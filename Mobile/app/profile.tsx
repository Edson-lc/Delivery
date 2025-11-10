import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  ActivityIndicator,
  Modal,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, getColors } from '../src/constants';
import httpClient from '../src/api/httpClient';
import OrderHistoryModal from '../src/components/OrderHistoryModal';
import ActiveOrderCard from '../src/components/ActiveOrderCard';

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

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout, updateUser, checkAuthStatus } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const colors = getColors(isDark);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editableData, setEditableData] = useState({
    fullName: '',
    nome: '',
    sobrenome: '',
    email: '',
    telefone: '',
    nif: '',
  });
  const [isPersonalInfoExpanded, setIsPersonalInfoExpanded] = useState(false);

  // Estados para gerenciamento de endereços
  const [userAddresses, setUserAddresses] = useState<Address[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    nome: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    cep: '',
    latitude: null as number | null,
    longitude: null as number | null,
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
  const [isOrderHistoryVisible, setIsOrderHistoryVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>(undefined);

  // Detectar se é tablet
  const isTablet = useMemo(() => {
    const screenWidth = Dimensions.get('window').width;
    return screenWidth > 600;
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (user) {
      setEditableData({
        fullName: user.fullName || '',
        nome: user.nome || '',
        sobrenome: user.sobrenome || '',
        email: user.email || '',
        telefone: user.telefone || '',
        nif: (user as any).nif || '',
      });
    }
  }, [user, isAuthenticated]);

  // Função para buscar endereços do usuário
  const fetchUserAddresses = useCallback(async () => {
    if (!isAuthenticated || !user) {
      return;
    }
    
    try {
      setIsLoadingAddresses(true);
      
      if ((user as any).enderecosSalvos && Array.isArray((user as any).enderecosSalvos)) {
        setUserAddresses((user as any).enderecosSalvos);
      } else {
        setUserAddresses([]);
      }
    } catch (error) {
      console.error('❌ Erro ao processar endereços:', error);
      setUserAddresses([]);
    } finally {
      setIsLoadingAddresses(false);
    }
  }, [isAuthenticated, user]);

  // Buscar endereços quando o componente montar ou usuário mudar
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserAddresses();
    }
  }, [isAuthenticated, fetchUserAddresses]);

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
    if (isAddressModalVisible && !newAddress.latitude && !newAddress.longitude && !editingAddress) {
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
        }
      };

      getAutoLocation();
    }
  }, [isAddressModalVisible, editingAddress]);

  const handleEdit = () => {
    setIsEditing(true);
    setIsPersonalInfoExpanded(true); // Expande a seção quando clicar em editar
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);

      // Preparar dados para atualização
      const updateData: any = {
        fullName: editableData.fullName,
        nome: editableData.nome,
        sobrenome: editableData.sobrenome,
        telefone: editableData.telefone,
      };

      if (editableData.nif) {
        updateData.nif = editableData.nif;
      }

      // Chamar API para atualizar
      const response = await httpClient.put(`/users/${user.id}`, updateData);

      // Atualizar contexto local
      updateUser(response);

      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
      setIsEditing(false);

      // Recarregar dados do usuário
      await checkAuthStatus();
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      Alert.alert(
        'Erro',
        error.message || 'Não foi possível atualizar o perfil. Tente novamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Restaurar dados originais
    if (user) {
      setEditableData({
        fullName: user.fullName || '',
        nome: user.nome || '',
        sobrenome: user.sobrenome || '',
        email: user.email || '',
        telefone: user.telefone || '',
        nif: (user as any).nif || '',
      });
    }
    setSelectedImage(null);
    setIsEditing(false);
  };

  const requestImagePickerPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão Necessária',
          'Precisamos de acesso à galeria para selecionar uma foto.',
          [{ text: 'OK' }]
        );
        return false;
      }
    }
    return true;
  };

  const handleImagePicker = async () => {
    try {
      const hasPermission = await requestImagePickerPermissions();
      if (!hasPermission) return;

      // Mostrar opções: Câmera ou Galeria
      Alert.alert(
        'Selecionar Foto',
        'Escolha uma opção',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Câmera',
            onPress: async () => {
              const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
              if (cameraStatus.status !== 'granted') {
                Alert.alert(
                  'Permissão Necessária',
                  'Precisamos de acesso à câmera para tirar uma foto.'
                );
                return;
              }

              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });

              if (!result.canceled && result.assets[0]) {
                await processImage(result.assets[0].uri);
              }
            },
          },
          {
            text: 'Galeria',
            onPress: async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });

              if (!result.canceled && result.assets[0]) {
                await processImage(result.assets[0].uri);
              }
            },
          },
        ],
        { cancelable: true }
      );
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  const processImage = async (uri: string) => {
    try {
      setIsUploadingPhoto(true);

      console.log('📸 Processando imagem:', uri);

      // Redimensionar e comprimir a imagem
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }], // Redimensionar para no máximo 800px de largura
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      console.log('✅ Imagem manipulada:', manipulatedImage.uri);

      // Atualizar a imagem localmente primeiro para feedback imediato
      setSelectedImage(manipulatedImage.uri);

      // Converter para base64
      console.log('🔄 Convertendo para base64...');
      const base64String = await convertToBase64(manipulatedImage.uri);
      console.log('✅ Base64 gerado, tamanho:', base64String.length);

      // Fazer upload da imagem
      await uploadImage(base64String);
    } catch (error) {
      console.error('❌ Erro ao processar imagem:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      Alert.alert('Erro', `Não foi possível processar a imagem: ${errorMessage}`);
      setIsUploadingPhoto(false);
      setSelectedImage(null);
    }
  };

  const convertToBase64 = async (uri: string): Promise<string> => {
    try {
      console.log('🔄 Convertendo URI para base64:', uri);
      
      // Se já for uma data URI, retornar diretamente
      if (uri.startsWith('data:')) {
        console.log('✅ URI já é data URI, retornando diretamente');
        return uri;
      }

      // Usar fetch para ler o arquivo (funciona tanto no web quanto no React Native)
      console.log('📥 Fazendo fetch da URI...');
      const response = await fetch(uri);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Converter para blob
      const blob = await response.blob();
      console.log('✅ Blob criado, tamanho:', blob.size);

      // Converter blob para base64 usando FileReader
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onloadend = () => {
          const base64String = reader.result as string;
          if (base64String) {
            console.log('✅ Base64 gerado com sucesso, tamanho:', base64String.length);
            resolve(base64String);
          } else {
            reject(new Error('Resultado vazio do FileReader'));
          }
        };
        
        reader.onerror = (error) => {
          console.error('❌ FileReader error:', error);
          reject(new Error('Erro ao converter imagem para base64'));
        };
        
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('❌ Erro ao converter para base64:', error);
      throw new Error(`Erro ao converter imagem para base64: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const uploadImage = async (base64Image: string) => {
    try {
      if (!user) return;

      // Atualizar o perfil com a nova foto (usando base64 como URL temporária)
      // Nota: Em produção, você deve fazer upload para um serviço de armazenamento
      // (AWS S3, Cloudinary, etc.) e usar a URL retornada
      const fotoUrl = base64Image; // Por enquanto, usar base64 direto

      const response = await httpClient.put(`/users/${user.id}`, {
        fotoUrl,
      });

      // Atualizar contexto local
      updateUser(response);

      Alert.alert('Sucesso', 'Foto de perfil atualizada com sucesso!');
      
      // Recarregar dados do usuário
      await checkAuthStatus();
    } catch (error: any) {
      console.error('Erro ao fazer upload da imagem:', error);
      Alert.alert(
        'Erro',
        error.message || 'Não foi possível fazer upload da foto. Tente novamente.'
      );
      setSelectedImage(null);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  // Funções de gerenciamento de endereços
  const validateAddress = () => {
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

  const updateAddressField = (field: string, value: string) => {
    setNewAddress(prev => ({ ...prev, [field]: value }));
    if (addressErrors[field as keyof typeof addressErrors]) {
      setAddressErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddAddress = async () => {
    if (!validateAddress()) {
      return;
    }

    try {
      const addressData = {
        id: editingAddress?.id || `addr_${Date.now()}`,
        nome: newAddress.nome,
        rua: newAddress.rua,
        numero: newAddress.numero,
        complemento: newAddress.complemento,
        bairro: newAddress.bairro,
        cidade: newAddress.cidade,
        cep: newAddress.cep,
        latitude: newAddress.latitude,
        longitude: newAddress.longitude,
      };

      const currentAddresses = (user as any)?.enderecosSalvos || [];
      
      let updatedAddresses: Address[];
      if (editingAddress) {
        // Editar endereço existente
        updatedAddresses = currentAddresses.map((addr: Address) =>
          addr.id === editingAddress.id ? addressData : addr
        );
      } else {
        // Adicionar novo endereço
        updatedAddresses = [...currentAddresses, addressData];
      }

      const response = await httpClient.put(`/users/${user?.id}`, {
        enderecosSalvos: updatedAddresses,
      }) as any;

      // Atualizar o contexto do usuário com os dados retornados ou com os atualizados localmente
      if (response && response.enderecosSalvos) {
        updateUser({ enderecosSalvos: response.enderecosSalvos });
        setUserAddresses(response.enderecosSalvos);
      } else {
        updateUser({ enderecosSalvos: updatedAddresses });
        setUserAddresses(updatedAddresses);
      }

      // Recarregar dados do usuário para garantir sincronização
      await checkAuthStatus();
      
      Alert.alert(
        editingAddress ? 'Endereço Atualizado!' : 'Endereço Adicionado!',
        `Endereço "${newAddress.nome}" foi ${editingAddress ? 'atualizado' : 'adicionado'} com sucesso.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setIsAddressModalVisible(false);
              setIsAddingAddress(false);
              resetAddressForm();
              // Forçar atualização da lista
              fetchUserAddresses();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Erro ao salvar endereço:', error);
      Alert.alert(
        'Erro',
        'Não foi possível salvar o endereço. Tente novamente.'
      );
    }
  };

  const handleDeleteAddress = (addressId: string) => {
    Alert.alert(
      'Excluir Endereço',
      'Tem certeza que deseja excluir este endereço?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const currentAddresses = (user as any)?.enderecosSalvos || [];
              const updatedAddresses = currentAddresses.filter((addr: Address) => addr.id !== addressId);

              await httpClient.put(`/users/${user?.id}`, {
                enderecosSalvos: updatedAddresses,
              });

              updateUser({ enderecosSalvos: updatedAddresses });
              setUserAddresses(updatedAddresses);
              
              Alert.alert('Sucesso', 'Endereço excluído com sucesso!');
            } catch (error: any) {
              console.error('Erro ao excluir endereço:', error);
              Alert.alert('Erro', 'Não foi possível excluir o endereço.');
            }
          },
        },
      ]
    );
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setIsAddingAddress(false);
    setNewAddress({
      nome: address.nome,
      rua: address.rua,
      numero: address.numero,
      complemento: address.complemento || '',
      bairro: address.bairro,
      cidade: address.cidade,
      cep: address.cep,
      latitude: address.latitude || null,
      longitude: address.longitude || null,
    });
    if (address.latitude && address.longitude) {
      setSelectedLocation({
        latitude: address.latitude,
        longitude: address.longitude,
      });
    }
    setIsAddressModalVisible(true);
  };

  const resetAddressForm = () => {
    setEditingAddress(null);
    setIsAddingAddress(false);
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

  const handleOpenAddressModal = () => {
    resetAddressForm();
    setEditingAddress(null);
    setIsAddingAddress(true);
    setIsAddressModalVisible(true);
  };

  const handleCancelAddressModal = () => {
    setIsAddressModalVisible(false);
    setIsAddingAddress(false);
    resetAddressForm();
  };

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);

    try {
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

  const handleOpenMap = async () => {
    if (newAddress.latitude && newAddress.longitude) {
      setSelectedLocation({
        latitude: newAddress.latitude,
        longitude: newAddress.longitude,
      });
    } else {
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
          setSelectedLocation({
            latitude: 41.2704,
            longitude: -8.0818,
          });
        }
      } catch (error) {
        console.error('Erro ao obter localização para o mapa:', error);
        setSelectedLocation({
          latitude: 41.2704,
          longitude: -8.0818,
        });
      }
    }
    
    setIsMapOpen(true);
  };

  const handleLocationSelect = (locationData: { latitude: number; longitude: number }) => {
    setSelectedLocation(locationData);
    setNewAddress(prev => ({
      ...prev,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
    }));
    setShowCoordinatesObtained(true);
    setIsMapOpen(false);
    
    setTimeout(() => {
      setShowCoordinatesObtained(false);
    }, 3000);
  };

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

  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.background, borderWidth: 0 }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Meu Perfil</Text>
        <View style={styles.headerRight}>
          {!isEditing ? (
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleEdit}
              activeOpacity={0.7}
            >
              <MaterialIcons name="edit" size={24} color={colors.primary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerRightPlaceholder} />
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Foto de Perfil */}
        <View style={styles.profileImageContainer}>
          {selectedImage ? (
            <Image
              source={{ uri: selectedImage }}
              style={styles.profileImage}
              resizeMode="cover"
            />
          ) : user.fotoUrl && !user.fotoUrl.startsWith('data:') ? (
            <Image
              source={{ uri: user.fotoUrl }}
              style={styles.profileImage}
              resizeMode="cover"
            />
          ) : user.fotoUrl && user.fotoUrl.startsWith('data:') ? (
            <Image
              source={{ uri: user.fotoUrl }}
              style={styles.profileImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.profileImagePlaceholder, { backgroundColor: colors.border, borderColor: colors.surface }]}>
              <MaterialIcons name="person" size={64} color={colors.textSecondary} />
            </View>
          )}
          <TouchableOpacity
            style={[
              styles.profileImageBadge,
              isUploadingPhoto && styles.profileImageBadgeLoading
            ]}
            onPress={handleImagePicker}
            disabled={isUploadingPhoto}
            activeOpacity={0.7}
          >
            {isUploadingPhoto ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <MaterialIcons name="camera-alt" size={16} color="white" />
            )}
          </TouchableOpacity>
        </View>

        {/* Nome do Usuário */}
        <Text style={[styles.userName, { color: colors.text }]}>
          {user.fullName || user.nome || 'Usuário'}
        </Text>
        <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user.email}</Text>

        {/* Card de Pedido em Andamento */}
        <ActiveOrderCard
          onViewDetails={(orderId) => {
            setSelectedOrderId(orderId);
            setIsOrderHistoryVisible(true);
          }}
        />

        {/* Seção de Informações */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setIsPersonalInfoExpanded(!isPersonalInfoExpanded)}
            activeOpacity={0.7}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Informações Pessoais</Text>
            <MaterialIcons
              name={isPersonalInfoExpanded ? 'expand-less' : 'expand-more'}
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {isPersonalInfoExpanded && (
            <View style={styles.expandedContent}>
              {/* Nome Completo */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Nome Completo</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                    value={editableData.fullName}
                    onChangeText={(text) =>
                      setEditableData({ ...editableData, fullName: text })
                    }
                    placeholder="Digite seu nome completo"
                    placeholderTextColor={colors.textSecondary}
                  />
                ) : (
                  <Text style={[styles.value, { color: colors.text }]}>
                    {user.fullName || user.nome || 'Não informado'}
                  </Text>
                )}
              </View>

              {/* Primeiro Nome */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Primeiro Nome</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                    value={editableData.nome}
                    onChangeText={(text) =>
                      setEditableData({ ...editableData, nome: text })
                    }
                    placeholder="Digite seu primeiro nome"
                    placeholderTextColor={colors.textSecondary}
                  />
                ) : (
                  <Text style={[styles.value, { color: colors.text }]}>
                    {user.nome || 'Não informado'}
                  </Text>
                )}
              </View>

              {/* Sobrenome */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Sobrenome</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                    value={editableData.sobrenome}
                    onChangeText={(text) =>
                      setEditableData({ ...editableData, sobrenome: text })
                    }
                    placeholder="Digite seu sobrenome"
                    placeholderTextColor={colors.textSecondary}
                  />
                ) : (
                  <Text style={[styles.value, { color: colors.text }]}>
                    {user.sobrenome || 'Não informado'}
                  </Text>
                )}
              </View>

              {/* Email */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>E-mail</Text>
                <Text style={[styles.value, { color: colors.textSecondary }]}>{user.email}</Text>
                <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                  O e-mail não pode ser alterado
                </Text>
              </View>

              {/* Telefone */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Telefone</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                    value={editableData.telefone}
                    onChangeText={(text) =>
                      setEditableData({ ...editableData, telefone: text })
                    }
                    placeholder="Digite seu telefone"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="phone-pad"
                  />
                ) : (
                  <Text style={[styles.value, { color: colors.text }]}>
                    {user.telefone || 'Não informado'}
                  </Text>
                )}
              </View>

              {/* NIF */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>NIF</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                    value={editableData.nif}
                    onChangeText={(text) =>
                      setEditableData({ ...editableData, nif: text })
                    }
                    placeholder="Digite seu NIF"
                    placeholderTextColor={colors.textSecondary}
                  />
                ) : (
                  <Text style={[styles.value, { color: colors.text }]}>
                    {(user as any).nif || 'Não informado'}
                  </Text>
                )}
              </View>

              {/* Botão de Editar/Salvar */}
              {!isEditing ? (
                <TouchableOpacity
                  style={[styles.editButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={handleEdit}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="edit" size={20} color={colors.primary} />
                  <Text style={[styles.editButtonText, { color: colors.primary }]}>Editar Informações</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: colors.primary }, isLoading && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={isLoading}
                    activeOpacity={0.7}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <>
                        <MaterialIcons name="check" size={20} color="white" />
                        <Text style={styles.saveButtonText}>Salvar</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.cancelButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={handleCancel}
                    disabled={isLoading}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="close" size={20} color={colors.text} />
                    <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Seção de Ações */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: SPACING.md }]}>Ações</Text>

          {/* Endereços */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => setIsAddressModalVisible(true)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="location-on" size={24} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Meus Endereços</Text>
            <View style={[styles.addressBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.addressBadgeText}>{userAddresses.length}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Histórico de Pedidos */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => setIsOrderHistoryVisible(true)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="history" size={24} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Histórico de Pedidos</Text>
            <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Métodos de Pagamento */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => {
              Alert.alert('Em breve', 'Métodos de pagamento em breve!');
            }}
            activeOpacity={0.7}
          >
            <MaterialIcons name="credit-card" size={24} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Métodos de Pagamento</Text>
            <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Seção de Configurações */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: SPACING.md }]}>Configurações</Text>

          {/* Dark Mode */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            <MaterialIcons 
              name={theme === 'system' ? 'brightness-auto' : (isDark ? 'dark-mode' : 'light-mode')} 
              size={24} 
              color={colors.primary} 
            />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>
              {theme === 'system' ? 'Seguir Sistema' : (isDark ? 'Modo Escuro' : 'Modo Claro')}
            </Text>
            <View style={styles.toggleContainer}>
              <View style={[
                styles.toggle, 
                { backgroundColor: isDark ? colors.primary : colors.border }
              ]}>
                <View style={[styles.toggleThumb, isDark && styles.toggleThumbActive]} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Botão de Logout */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.surface, borderWidth: 0 }]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <MaterialIcons name="logout" size={24} color={colors.error} />
          <Text style={[styles.logoutButtonText, { color: colors.error }]}>Sair da Conta</Text>
        </TouchableOpacity>

        {/* Espaçamento final */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Modal de Gerenciamento de Endereços */}
      <Modal 
        visible={isAddressModalVisible} 
        animationType="slide" 
        presentationStyle="pageSheet"
        onRequestClose={handleCancelAddressModal}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
          {/* Header do Modal */}
          <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <TouchableOpacity 
              style={[styles.modalBackButton, { backgroundColor: colors.background, borderWidth: 0 }]}
              onPress={handleCancelAddressModal}
            >
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingAddress ? 'Editar Endereço' : isAddingAddress ? 'Adicionar Endereço' : 'Meus Endereços'}
            </Text>
            <View style={styles.modalHeaderSpacer} />
          </View>

          {(editingAddress || isAddingAddress) ? (
            /* Formulário de Adicionar/Editar Endereço */
            <>
            <ScrollView 
              style={styles.modalContent} 
              contentContainerStyle={styles.modalScrollContent}
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
                </View>

                {isTablet ? (
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
                
                {showCoordinatesObtained && (
                  <View style={[styles.locationStatusContainer, { backgroundColor: colors.surface }]}>
                    <MaterialIcons name="place" size={16} color={colors.success || '#10b981'} />
                    <Text style={[styles.locationStatusText, { color: colors.text }]}>
                      Localização obtida automaticamente
                    </Text>
                  </View>
                )}

                <View style={[styles.mapContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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
                
                <Text style={[styles.mapDescription, { color: colors.textSecondary, backgroundColor: colors.surface }]}>
                  Esta é a localização exata que será usada para entregas
                </Text>

                <View style={styles.mapButtonsContainer}>
                  <TouchableOpacity 
                    style={[styles.mapButton, { backgroundColor: colors.surface, borderWidth: 0 }]}
                    onPress={handleOpenMap}
                  >
                    <MaterialIcons name="place" size={20} color={colors.primary} />
                    <Text style={[styles.mapButtonText, { color: colors.text }]}>Ajustar Local</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.mapButton, { backgroundColor: colors.surface, borderWidth: 0 }]}
                    onPress={getCurrentLocation}
                    disabled={isGettingLocation}
                  >
                    {isGettingLocation ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <MaterialIcons name="my-location" size={20} color={colors.primary} />
                    )}
                    <Text style={[styles.mapButtonText, { color: colors.text }]}>Meu Local</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            {/* Botões do Modal */}
            <View style={[styles.modalButtons, { borderTopColor: colors.border }]}>
              <TouchableOpacity 
                style={[styles.modalCancelButton, { backgroundColor: colors.surface, borderWidth: 0 }]}
                onPress={handleCancelAddressModal}
              >
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalSaveButton, { backgroundColor: colors.primary }]}
                onPress={handleAddAddress}
              >
                <Text style={styles.modalSaveText}>
                  {editingAddress ? 'Salvar' : 'Adicionar'}
                </Text>
              </TouchableOpacity>
            </View>
            </>
          ) : (
            /* Lista de Endereços */
            <View style={[styles.modalContentContainer, { backgroundColor: colors.background }]}>
              <ScrollView 
                style={styles.addressesScrollView}
                contentContainerStyle={styles.addressesScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {isLoadingAddresses ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Carregando endereços...</Text>
                  </View>
                ) : userAddresses.length > 0 ? (
                  <View style={styles.addressesList}>
                    {userAddresses.map((address) => (
                      <View key={address.id} style={[styles.addressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={styles.addressCardContent}>
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
                            {address.cep && (
                              <View style={styles.addressCepRow}>
                                <Text style={[styles.addressCep, { color: colors.textSecondary }]}>{address.cep}</Text>
                                <View style={styles.addressActions}>
                                  <TouchableOpacity
                                    style={[styles.addressActionButton, { backgroundColor: colors.background }]}
                                    onPress={() => handleEditAddress(address)}
                                    activeOpacity={0.7}
                                  >
                                    <MaterialIcons name="edit" size={20} color={colors.primary} />
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={[styles.addressActionButton, styles.deleteButton, { backgroundColor: colors.error + '20' }]}
                                    onPress={() => handleDeleteAddress(address.id)}
                                    activeOpacity={0.7}
                                  >
                                    <MaterialIcons name="delete" size={20} color={colors.error} />
                                  </TouchableOpacity>
                                </View>
                              </View>
                            )}
                            {!address.cep && (
                              <View style={styles.addressActions}>
                                <TouchableOpacity
                                  style={[styles.addressActionButton, { backgroundColor: colors.background }]}
                                  onPress={() => handleEditAddress(address)}
                                  activeOpacity={0.7}
                                >
                                  <MaterialIcons name="edit" size={20} color={colors.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={[styles.addressActionButton, styles.deleteButton, { backgroundColor: colors.error + '20' }]}
                                  onPress={() => handleDeleteAddress(address.id)}
                                  activeOpacity={0.7}
                                >
                                  <MaterialIcons name="delete" size={20} color={colors.error} />
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyAddressesContainer}>
                    <MaterialIcons name="place" size={48} color={colors.textSecondary} />
                    <Text style={[styles.emptyAddressesTitle, { color: colors.text }]}>Nenhum endereço salvo</Text>
                    <Text style={[styles.emptyAddressesText, { color: colors.textSecondary }]}>
                      Adicione um endereço para facilitar seus pedidos
                    </Text>
                  </View>
                )}
              </ScrollView>

              {/* Botão para adicionar novo endereço - sempre visível na parte inferior */}
              <View style={[styles.addAddressButtonContainer, { backgroundColor: colors.background }]}>
                <TouchableOpacity 
                  style={styles.addAddressButton}
                  onPress={handleOpenAddressModal}
                >
                  <MaterialIcons name="add" size={24} color="white" />
                  <Text style={styles.addAddressText}>Adicionar Morada</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
          <View style={[styles.mapModalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <TouchableOpacity 
              style={[styles.mapModalBackButton, { backgroundColor: colors.background, borderWidth: 0 }]}
              onPress={() => setIsMapOpen(false)}
            >
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.mapModalTitle, { color: colors.text }]}>Selecionar Localização</Text>
            <View style={styles.mapModalHeaderSpacer} />
          </View>

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
          
          <View style={[styles.mapActionButtons, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
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
              style={[styles.mapActionButtonSecondary, { backgroundColor: colors.surface, borderWidth: 0 }]}
              onPress={() => setIsMapOpen(false)}
            >
              <Text style={[styles.mapActionButtonSecondaryText, { color: colors.text }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Modal de Histórico de Pedidos */}
      <OrderHistoryModal
        visible={isOrderHistoryVisible}
        onClose={() => {
          setIsOrderHistoryVisible(false);
          setSelectedOrderId(undefined);
        }}
        initialOrderId={selectedOrderId}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
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
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  headerRightPlaceholder: {
    width: 40,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    padding: SPACING.xs,
  },
  editButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#ffffff',
    backgroundColor: COLORS.border,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  profileImageBadge: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileImageBadgeLoading: {
    opacity: 0.7,
  },
  userName: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  userEmail: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  section: {
    backgroundColor: '#ffffff',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  expandedContent: {
    marginTop: SPACING.md,
  },
  inputContainer: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  input: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    backgroundColor: '#F9FAFB',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  value: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    paddingVertical: SPACING.xs,
  },
  disabledValue: {
    color: COLORS.textSecondary,
  },
  helperText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    backgroundColor: '#F9FAFB',
  },
  actionButtonText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.xs,
  },
  cancelButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: SPACING.md,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.error,
    gap: SPACING.sm,
  },
  logoutButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.error,
  },
  bottomSpacing: {
    height: SPACING.xl,
  },
  toggleContainer: {
    marginLeft: 'auto',
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: COLORS.primary,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  // Estilos para endereços
  addressBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  addressBadgeText: {
    color: 'white',
    fontSize: FONT_SIZES.xs,
    fontWeight: 'bold',
  },
  // Modal de Endereço
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
  },
  modalScrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  modalContentContainer: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
    justifyContent: 'space-between',
  },
  // Estilos de formulário de endereço
  fieldsContainer: {
    gap: SPACING.md,
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
  errorText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    flex: 1,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  halfInputGroup: {
    flex: 1,
    gap: SPACING.smd,
  },
  numeroInputGroup: {
    flex: 1,
    gap: SPACING.smd,
  },
  cepInputGroup: {
    flex: 1,
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
    marginTop: SPACING.md,
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
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  locationStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  locationStatusText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    flex: 1,
  },
  mapContainer: {
    marginTop: SPACING.md,
    marginHorizontal: 0,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#ffffff',
    height: 250,
  },
  map: {
    height: 250,
    width: '100%',
  },
  mapDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
  },
  // Modal do Mapa
  mapModalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  mapModalHeader: {
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
  mapModalBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
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
  mapModalContent: {
    flex: 1,
    width: '100%',
    backgroundColor: '#ffffff',
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
  // Lista de endereços
  addressesScrollView: {
    flex: 1,
  },
  addressesScrollContent: {
    paddingBottom: SPACING.sm,
    flexGrow: 1,
  },
  addAddressButtonContainer: {
    paddingTop: SPACING.md,
    backgroundColor: '#ffffff',
  },
  addressesList: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  addressCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addressCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  addressInfo: {
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
    marginBottom: SPACING.xs,
  },
  addressCity: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 0,
  },
  addressCepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 0,
  },
  addressCep: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  addressActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    justifyContent: 'flex-end',
  },
  addressActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
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
});
